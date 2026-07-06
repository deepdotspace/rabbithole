/**
 * Nodes — every finding in every hole. One flat collection; the tree is formed
 * by `parentId`. Findings are created server-side (server actions), so clients
 * cannot create them directly — they can only toggle `collapsed` on their own
 * nodes. `visibility` mirrors the parent hole so a shared hole's whole tree is
 * readable by link.
 */

import type { CollectionSchema } from 'deepspace/worker'

export const nodesSchema: CollectionSchema = {
  name: 'nodes',
  columns: [
    { name: 'holeId', storage: 'text', interpretation: 'plain' },
    { name: 'parentId', storage: 'text', interpretation: 'plain' },
    {
      name: 'lens',
      storage: 'text',
      interpretation: { kind: 'select', options: ['root', 'exa', 'wikipedia', 'newsapi', 'websearch'] },
    },
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'body', storage: 'text', interpretation: 'plain' },
    { name: 'sources', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'refs', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'focus', storage: 'text', interpretation: 'plain' },
    { name: 'pullId', storage: 'text', interpretation: 'plain' },
    { name: 'collapsed', storage: 'text', interpretation: { kind: 'json' } },
    {
      name: 'visibility',
      storage: 'text',
      interpretation: { kind: 'select', options: ['private', 'shared'] },
    },
    { name: 'ownerId', storage: 'text', interpretation: 'plain', userBound: true, immutable: true },
  ],
  ownerField: 'ownerId',
  visibilityField: { field: 'visibility', value: 'shared' },
  permissions: {
    '*': { read: 'published', create: false, update: false, delete: false },
    viewer: { read: 'published', create: false, update: false, delete: false },
    member: { read: 'published', create: false, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
