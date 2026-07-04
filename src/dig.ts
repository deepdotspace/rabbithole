/**
 * Digging logic — pure helpers shared by the pull-thread server action.
 *
 * These build the query for a lens, normalize each lens's raw response into a
 * common shape, and assemble the synthesis prompt / parse its output. No I/O
 * here; the action supplies `tools.integration` and does the actual calls.
 */

import type { LensId } from './lenses'
import type { Source } from './types'

/** A raw hit from a lens before it is narrated into a finding. */
export interface RawHit {
  title: string
  url: string
  snippet: string
  date?: string
}

export interface NarratedFinding {
  title: string
  narration: string
  sources: Source[]
}

const MAX_HITS = 4

function clean(s: unknown): string {
  return String(s ?? '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const STOPWORDS = new Set([
  'how', 'why', 'what', 'when', 'where', 'who', 'whom', 'which', 'whose',
  'did', 'do', 'does', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'of',
  'to', 'in', 'on', 'for', 'and', 'or', 'about', 'into', 'that', 'this',
  'with', 'from', 'as', 'it', 'its', 'be', 'has', 'have', 'had', 'can',
  'could', 'would', 'should', 'will',
])

/** Turn a verbose phrase/question into keyword-ish terms for keyword search. */
function keywordize(s: string, maxWords = 8): string {
  const words = clean(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
  const kept = words.slice(0, maxWords)
  return kept.length ? kept.join(' ') : clean(s).slice(0, 120)
}

/** Build the search query for a lens from the parent finding's context. */
export function buildQuery(rootQuestion: string, parentTitle: string, parentBody: string, lens: LensId): string {
  const focus = clean(parentTitle) || clean(rootQuestion)
  const context = clean(parentBody).slice(0, 240)
  if (lens === 'wikipedia') {
    // Wikipedia search is title/keyword-oriented — drop question scaffolding.
    return keywordize(focus, 6)
  }
  if (lens === 'newsapi') {
    // NewsAPI does boolean keyword matching; a terse keyword phrase beats a sentence.
    return keywordize(focus, 8)
  }
  // Exa / websearch take a natural-language prompt with context.
  const anchor = clean(rootQuestion)
  return context && focus !== anchor
    ? `${focus} — in the context of: ${anchor}`
    : focus || anchor
}

/** Normalize a lens's raw `integration.data` payload into RawHits. */
export function normalizeHits(lens: LensId, data: unknown): RawHit[] {
  const hits: RawHit[] = []
  const d = data as Record<string, unknown> | unknown[] | null
  if (!d) return hits

  if (lens === 'exa') {
    const citations = (d as Record<string, unknown>).citations
    if (Array.isArray(citations)) {
      for (const c of citations as Record<string, unknown>[]) {
        const url = clean(c.url)
        if (!url) continue
        hits.push({
          title: clean(c.title) || url,
          url,
          snippet: clean(c.text).slice(0, 700),
          date: c.publishedDate ? clean(c.publishedDate) : undefined,
        })
      }
    }
  } else if (lens === 'wikipedia') {
    const arr = Array.isArray(d) ? d : []
    for (const p of arr as Record<string, unknown>[]) {
      const key = clean(p.key) || clean(p.title).replace(/\s+/g, '_')
      if (!key) continue
      hits.push({
        title: clean(p.title) || key,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(key)}`,
        snippet: clean(p.excerpt) || clean(p.description),
      })
    }
  } else if (lens === 'newsapi') {
    const articles = (d as Record<string, unknown>).articles
    if (Array.isArray(articles)) {
      for (const a of articles as Record<string, unknown>[]) {
        const url = clean(a.url)
        if (!url) continue
        hits.push({
          title: clean(a.title) || url,
          url,
          snippet: (clean(a.description) || clean(a.content)).slice(0, 500),
          date: a.publishedAt ? clean(a.publishedAt) : undefined,
        })
      }
    }
  } else if (lens === 'websearch') {
    const citations = (d as Record<string, unknown>).citations
    if (Array.isArray(citations)) {
      for (const c of citations as Record<string, unknown>[]) {
        const url = clean(c.url) || clean((c as Record<string, unknown>).link)
        if (!url) continue
        hits.push({
          title: clean(c.title) || url,
          url,
          snippet: (
            clean((c as Record<string, unknown>).snippet) ||
            clean((c as Record<string, unknown>).text) ||
            clean((c as Record<string, unknown>).content) ||
            clean((c as Record<string, unknown>).summary)
          ).slice(0, 500),
        })
      }
    }
  }

  // De-dupe by URL and cap.
  const seen = new Set<string>()
  const out: RawHit[] = []
  for (const h of hits) {
    if (seen.has(h.url)) continue
    seen.add(h.url)
    out.push(h)
    if (out.length >= MAX_HITS) break
  }
  return out
}

/** 0 = plainest, 100 = most speculative. */
export function toneDescriptor(tone: number): { label: string; instruction: string } {
  const t = Math.max(0, Math.min(100, tone))
  if (t <= 33) {
    return {
      label: 'straight',
      instruction:
        'Narrate each finding plainly and factually in ONE sentence. State only what the source supports. No speculation, no rhetorical questions.',
    }
  }
  if (t <= 66) {
    return {
      label: 'balanced',
      instruction:
        'Narrate each finding in one or two sentences. Lead with the fact, then note in a clause why it matters to the question. Light connective framing, no invention.',
    }
  }
  return {
    label: 'deep end',
    instruction:
      'Narrate each finding in two or three sentences that connect the dots back to the question and hint at where the thread could lead next. You may frame implications and open questions, but never invent facts or sources — speculation must read as speculation, grounded in the snippet.',
  }
}

export function buildSynthPrompt(args: {
  rootQuestion: string
  parentTitle: string
  tone: number
  hits: RawHit[]
}): { system: string; user: string } {
  const { rootQuestion, parentTitle, tone, hits } = args
  const { instruction } = toneDescriptor(tone)
  const system =
    'You turn raw search results into short, navigable research findings for an investigation board. ' +
    'You are given real sources; write a crisp title and a narration for each. ' +
    instruction +
    ' Titles are 3 to 8 words, sentence case, no trailing punctuation. ' +
    'Return ONLY a JSON array, one object per source in the same order, each {"title": string, "narration": string}. No prose, no code fences.'

  const sourceBlock = hits
    .map((h, i) => `[${i}] ${h.title}\n${h.snippet || '(no excerpt available)'}${h.date ? `\n(${h.date})` : ''}`)
    .join('\n\n')

  const user =
    `Investigation question: ${rootQuestion}\n` +
    `Pulling a thread from: ${parentTitle || rootQuestion}\n\n` +
    `Sources:\n${sourceBlock}\n\n` +
    `Write ${hits.length} finding object(s) as a JSON array.`

  return { system, user }
}

/** Extract the narrations array from the model text, tolerating fences/prose. */
export function parseNarrations(text: string, hits: RawHit[]): NarratedFinding[] {
  let parsed: unknown = null
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('[')
  const end = body.lastIndexOf(']')
  if (start !== -1 && end > start) {
    try {
      parsed = JSON.parse(body.slice(start, end + 1))
    } catch {
      parsed = null
    }
  }

  const rows = Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : []
  return hits.map((h, i) => {
    const row = rows[i] ?? {}
    const title = clean(row.title) || h.title
    const narration = clean(row.narration) || h.snippet || 'No summary available for this source.'
    return {
      title: title.slice(0, 140),
      narration,
      sources: [{ title: h.title, url: h.url }],
    }
  })
}
