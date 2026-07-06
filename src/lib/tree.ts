/**
 * Build the investigation tree from the flat node list, and derive the helpers
 * both views need: root, child lookup, path-to-node, and backlink counts.
 */

import type { NodeRecord, TreeNode } from '../types'
import { toMs } from './time'

export interface TreeModel {
  root?: NodeRecord
  byId: Map<string, NodeRecord>
  childrenOf: (id: string) => NodeRecord[]
  /** Ids of nodes whose `refs` point at the given node (backlink count = length). */
  backlinksTo: (id: string) => string[]
  /** Ordered path of node ids from root down to `id` (inclusive). */
  pathTo: (id: string) => string[]
  tree?: TreeNode
  nodeCount: number
}

export interface PullGroup {
  key: string
  /** The raw pullId ('' for legacy nodes created before pull grouping). */
  pid: string
  /** The dig focus shared by this pull's findings, if any. */
  focus: string
  items: NodeRecord[]
}

/**
 * Split a node's children into the pulls that produced them, in order. Findings
 * are createdAt-sorted, so one pull's findings are contiguous; a new pullId
 * starts a new group. Each pull renders as its own thread in both views.
 */
export function groupChildrenByPull(children: NodeRecord[]): PullGroup[] {
  const groups: PullGroup[] = []
  for (const c of children) {
    const pid = c.data.pullId || ''
    const last = groups[groups.length - 1]
    if (last && last.pid === pid) {
      last.items.push(c)
    } else {
      groups.push({ key: pid || `legacy-${groups.length}`, pid, focus: c.data.focus || '', items: [c] })
    }
  }
  return groups
}

export function buildTree(records: NodeRecord[]): TreeModel {
  const byId = new Map<string, NodeRecord>()
  const children = new Map<string, NodeRecord[]>()
  const backlinks = new Map<string, string[]>()
  let root: NodeRecord | undefined

  const sorted = [...records].sort((a, b) => toMs(a.createdAt) - toMs(b.createdAt))
  for (const r of sorted) {
    byId.set(r.recordId, r)
    if (!r.data.parentId) {
      if (!root) root = r
      continue
    }
    const arr = children.get(r.data.parentId) ?? []
    arr.push(r)
    children.set(r.data.parentId, arr)
  }

  for (const r of sorted) {
    for (const ref of r.data.refs ?? []) {
      const arr = backlinks.get(ref) ?? []
      arr.push(r.recordId)
      backlinks.set(ref, arr)
    }
  }

  const childrenOf = (id: string) => children.get(id) ?? []

  const parentPath = (id: string): string[] => {
    const path: string[] = []
    let cur: NodeRecord | undefined = byId.get(id)
    const guard = new Set<string>()
    while (cur && !guard.has(cur.recordId)) {
      guard.add(cur.recordId)
      path.unshift(cur.recordId)
      cur = cur.data.parentId ? byId.get(cur.data.parentId) : undefined
    }
    return path
  }

  const build = (rec: NodeRecord, depth: number): TreeNode => ({
    record: rec,
    depth,
    children: childrenOf(rec.recordId).map((c) => build(c, depth + 1)),
  })

  return {
    root,
    byId,
    childrenOf,
    backlinksTo: (id: string) => backlinks.get(id) ?? [],
    pathTo: parentPath,
    tree: root ? build(root, 0) : undefined,
    nodeCount: records.length,
  }
}
