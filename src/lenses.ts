/**
 * Lenses — the four ways a thread can be pulled, plus the neutral root.
 *
 * A lens is the source that surfaced a finding. Each has a stable color used
 * consistently in both the outline and columns views. Copy never names a model
 * or an assistant — a lens is just where the finding came from.
 */

export type LensId = 'root' | 'exa' | 'wikipedia' | 'newsapi' | 'websearch'

export interface Lens {
  id: LensId
  label: string
  /** One-line description of what this lens digs up. */
  blurb: string
  /** CSS custom property name holding the lens hue (defined in styles.css). */
  color: string
}

export const LENSES: Record<LensId, Lens> = {
  root: {
    id: 'root',
    label: 'Question',
    blurb: 'Where the hole begins.',
    color: 'var(--lens-root)',
  },
  exa: {
    id: 'exa',
    label: 'Exa',
    blurb: 'The deep neural trail — citation-linked sources.',
    color: 'var(--lens-exa)',
  },
  wikipedia: {
    id: 'wikipedia',
    label: 'Wikipedia',
    blurb: 'The established, reference account.',
    color: 'var(--lens-wikipedia)',
  },
  newsapi: {
    id: 'newsapi',
    label: 'News',
    blurb: 'What is being reported right now.',
    color: 'var(--lens-newsapi)',
  },
  websearch: {
    id: 'websearch',
    label: 'Web',
    blurb: 'The broad sweep across the open web.',
    color: 'var(--lens-websearch)',
  },
}

/** The lenses you can actually pull a thread with (root is not selectable). */
export const PULLABLE_LENSES: LensId[] = ['exa', 'wikipedia', 'newsapi', 'websearch']

export const DEFAULT_LENS: LensId = 'exa'

export function lensOf(id: string | undefined | null): Lens {
  return LENSES[(id as LensId) ?? 'root'] ?? LENSES.root
}
