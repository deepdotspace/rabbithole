/**
 * Core data model — one investigation tree, rendered two ways.
 *
 * A `Hole` is an investigation. A `Node` is one finding within it. Nodes form a
 * tree via `parentId` (empty string = the root question). The same tree is
 * rendered as an outline and as columns; there is no separate structure per view.
 *
 * Designed to grow: `visibility` already supports share-by-link, and `forkedFrom`
 * / `refs` leave room for forks, a gallery, and multiplayer without reshaping the
 * tree. None of those are built yet.
 */

import type { LensId } from './lenses'

export type Visibility = 'private' | 'shared'

export interface Source {
  title: string
  url: string
}

export interface Hole {
  title: string
  rootQuestion: string
  visibility: Visibility
  /** Narration dial persisted per hole (0 = straight, 100 = deep end). */
  tone: number
  ownerId: string
  /** Reserved for the future fork feature; empty when this hole is original. */
  forkedFrom: string
  // Index signature so records satisfy the SDK's Record<string, unknown> tools.
  [key: string]: unknown
}

export interface Node {
  holeId: string
  /** Empty string marks the root node (the question itself). */
  parentId: string
  lens: LensId
  title: string
  body: string
  sources: Source[]
  /** Ids of existing nodes this finding connects back to (shared sources). */
  refs: string[]
  /** The "dig into a specific angle" text the reader typed for this pull, if any. */
  focus: string
  /** Groups the findings created by one pull, so each pull renders as its own thread. */
  pullId: string
  collapsed: boolean
  visibility: Visibility
  ownerId: string
  [key: string]: unknown
}

/** Record envelope as returned by useQuery/useMutations (timestamps are strings). */
export interface Envelope<T> {
  recordId: string
  data: T
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type HoleRecord = Envelope<Hole>
export type NodeRecord = Envelope<Node>

/** A node plus its resolved children — built client-side from a flat list. */
export interface TreeNode {
  record: NodeRecord
  children: TreeNode[]
  depth: number
}
