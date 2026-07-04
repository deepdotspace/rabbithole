/**
 * Holes — one investigation ("rabbit hole") each.
 *
 * Owner-scoped via `ownerId` (stamped server-side in actions). A hole becomes
 * readable by anyone with the link when its `visibility` flips to `shared`
 * (the visibilityField gate). Reads only — every write goes through a server
 * action so the tree is written server-side and is durable / server-readable.
 */

import type { CollectionSchema } from 'deepspace/worker'

export const holesSchema: CollectionSchema = {
  name: 'holes',
  columns: [
    { name: 'title', storage: 'text', interpretation: 'plain' },
    { name: 'rootQuestion', storage: 'text', interpretation: 'plain' },
    {
      name: 'visibility',
      storage: 'text',
      interpretation: { kind: 'select', options: ['private', 'shared'] },
    },
    { name: 'tone', storage: 'number', interpretation: 'plain' },
    { name: 'ownerId', storage: 'text', interpretation: 'plain', userBound: true, immutable: true },
    { name: 'forkedFrom', storage: 'text', interpretation: 'plain' },
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
