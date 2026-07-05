/**
 * Server actions — every write to the investigation tree.
 *
 * All tree writes run here (not client-side) so findings are durable and
 * server-readable the moment they land, and so a fresh client always sees the
 * whole tree. `tools.*` bypass user RBAC; we stamp `ownerId` from the verified
 * caller and check ownership before spending on a dig.
 */

import type { ActionHandler, ActionTools } from 'deepspace/worker'
import type { Env } from '../../worker'
import type { Hole, Node, Source } from '../types'
import type { LensId } from '../lenses'
import { PULLABLE_LENSES } from '../lenses'
import {
  buildQuery,
  normalizeHits,
  buildSynthPrompt,
  parseNarrations,
  toneDescriptor,
} from '../dig'

interface Envelope<T> {
  recordId: string
  data: T
}

function titleFromQuestion(q: string): string {
  const t = q.trim().replace(/\s+/g, ' ')
  return (t.length > 72 ? `${t.slice(0, 69)}...` : t) || 'Untitled hole'
}

/** Query one lens through the integration proxy; returns the raw upstream data. */
async function queryLens(tools: ActionTools, lens: LensId, query: string): Promise<unknown> {
  const q = query.slice(0, 400)
  switch (lens) {
    case 'exa':
      return (await tools.integration('exa/answer', { query: q, text: true })).data
    case 'wikipedia':
      return (await tools.integration('wikipedia/search-pages', { query: q, limit: 6 })).data
    case 'newsapi':
      return (
        await tools.integration('newsapi/search-everything', {
          q,
          pageSize: 8,
          sortBy: 'relevancy',
          language: 'en',
          page: 1,
        })
      ).data
    case 'websearch':
      return (
        await tools.integration('websearch/advanced-search', {
          searchPrompt: q,
          queryHints: [],
          searchType: 'web',
          count: 6,
        })
      ).data
    default:
      return null
  }
}

export const actions: Record<string, ActionHandler<Env>> = {
  /** Start a hole: create the investigation + its root node (the question). */
  createHole: async ({ userId, params, tools }) => {
    const question = String(params.question ?? '').trim()
    if (!question) return { success: false, error: 'A question is required.' }
    const tone = typeof params.tone === 'number' ? params.tone : 40

    const hole: Hole = {
      title: titleFromQuestion(question),
      rootQuestion: question,
      visibility: 'private',
      tone,
      ownerId: userId,
      forkedFrom: '',
    }
    const created = await tools.create('holes', hole)
    if (!created.success) return created
    const holeId = created.data.recordId

    const root: Node = {
      holeId,
      parentId: '',
      lens: 'root',
      title: question,
      body: '',
      sources: [],
      refs: [],
      collapsed: false,
      visibility: 'private',
      ownerId: userId,
    }
    const rootRes = await tools.create('nodes', root)
    if (!rootRes.success) return rootRes

    return { success: true, data: { holeId, rootNodeId: rootRes.data.recordId } }
  },

  /** Pull a thread: dig with a lens under a node, nest the findings beneath it. */
  pullThread: async ({ userId, params, tools }) => {
    const holeId = String(params.holeId ?? '')
    const parentId = String(params.parentId ?? '')
    const lens = String(params.lens ?? '') as LensId
    const tone = typeof params.tone === 'number' ? params.tone : 40
    const focus = String(params.focus ?? '').trim().slice(0, 300)
    if (!holeId || !parentId) return { success: false, error: 'Missing hole or node.' }
    if (!PULLABLE_LENSES.includes(lens)) return { success: false, error: 'Unknown lens.' }

    const holeRes = await tools.get<Hole>('holes', holeId)
    if (!holeRes.success) return holeRes
    const hole = (holeRes.data as { record: Envelope<Hole> }).record
    if (hole.data.ownerId !== userId) {
      return { success: false, error: 'You can only dig in your own holes.' }
    }

    const parentRes = await tools.get<Node>('nodes', parentId)
    if (!parentRes.success) return parentRes
    const parent = (parentRes.data as { record: Envelope<Node> }).record

    const query = buildQuery(hole.data.rootQuestion, parent.data.title, parent.data.body, lens, focus)
    const raw = await queryLens(tools, lens, query)
    const hits = normalizeHits(lens, raw)
    if (hits.length === 0) {
      return { success: true, data: { created: [], note: 'no-findings' } }
    }

    // Narrate the hits with the tone dial applied.
    const { system, user } = buildSynthPrompt({
      rootQuestion: hole.data.rootQuestion,
      parentTitle: parent.data.title,
      tone,
      hits,
      focus,
    })
    const { label } = toneDescriptor(tone)
    let modelText = ''
    try {
      const ai = await tools.integration<{ content?: { text?: string }[] }>('anthropic/chat-completion', {
        model: 'claude-sonnet-4-5',
        max_tokens: 1400,
        temperature: label === 'straight' ? 0.2 : label === 'balanced' ? 0.5 : 0.8,
        system,
        messages: [{ role: 'user', content: user }],
      })
      if (ai.success && Array.isArray(ai.data?.content)) {
        modelText = ai.data.content.map((b) => b?.text ?? '').join('')
      }
    } catch {
      modelText = ''
    }
    const findings = parseNarrations(modelText, hits)

    // Build a URL -> existing nodeId index in this hole for backlinks.
    const existing = await tools.query<Node>('nodes', { where: { holeId }, limit: 1000 })
    const urlIndex = new Map<string, string>()
    if (existing.success) {
      for (const rec of (existing.data as { records: Envelope<Node>[] }).records) {
        for (const s of rec.data.sources ?? []) {
          if (s?.url) urlIndex.set(s.url, rec.recordId)
        }
      }
    }

    const created: { recordId: string; title: string; refs: string[] }[] = []
    for (const f of findings) {
      const refs = Array.from(
        new Set(
          f.sources
            .map((s: Source) => urlIndex.get(s.url))
            .filter((id): id is string => Boolean(id) && id !== parentId),
        ),
      )
      const node: Node = {
        holeId,
        parentId,
        lens,
        title: f.title,
        body: f.narration,
        sources: f.sources,
        refs,
        collapsed: false,
        visibility: hole.data.visibility,
        ownerId: userId,
      }
      const res = await tools.create('nodes', node)
      if (res.success) {
        const id = res.data.recordId
        created.push({ recordId: id, title: f.title, refs })
        for (const s of f.sources) if (s?.url) urlIndex.set(s.url, id)
      }
    }

    return { success: true, data: { created, lens } }
  },

  /** Flip a hole between private and shared-by-link; cascade to every node. */
  shareHole: async ({ userId, params, tools }) => {
    const holeId = String(params.holeId ?? '')
    const shared = Boolean(params.shared)
    if (!holeId) return { success: false, error: 'Missing hole.' }

    const holeRes = await tools.get<Hole>('holes', holeId)
    if (!holeRes.success) return holeRes
    const hole = (holeRes.data as { record: Envelope<Hole> }).record
    if (hole.data.ownerId !== userId) return { success: false, error: 'Not your hole.' }

    const visibility: Hole['visibility'] = shared ? 'shared' : 'private'
    await tools.update('holes', holeId, { visibility })
    const nodes = await tools.query<Node>('nodes', { where: { holeId }, limit: 1000 })
    if (nodes.success) {
      for (const rec of (nodes.data as { records: Envelope<Node>[] }).records) {
        await tools.update('nodes', rec.recordId, { visibility })
      }
    }
    return { success: true, data: { visibility } }
  },

  /** Delete a hole and its whole tree. Owner only. */
  deleteHole: async ({ userId, params, tools }) => {
    const holeId = String(params.holeId ?? '')
    if (!holeId) return { success: false, error: 'Missing hole.' }

    const holeRes = await tools.get<Hole>('holes', holeId)
    if (!holeRes.success) return holeRes
    const hole = (holeRes.data as { record: Envelope<Hole> }).record
    if (hole.data.ownerId !== userId) return { success: false, error: 'Not your hole.' }

    const nodes = await tools.query<Node>('nodes', { where: { holeId }, limit: 1000 })
    if (nodes.success) {
      for (const rec of (nodes.data as { records: Envelope<Node>[] }).records) {
        await tools.remove('nodes', rec.recordId)
      }
    }
    await tools.remove('holes', holeId)
    return { success: true, data: { deleted: true } }
  },
}
