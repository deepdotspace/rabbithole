import { X, Footprints } from 'lucide-react'
import type { TreeModel } from '../lib/tree'
import { LensDot } from './LensChip'
import { cn } from '@/lib/utils'

function short(s: string, n = 52): string {
  const t = (s ?? '').trim().replace(/\s+/g, ' ')
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

/** Where you've been — the most recent stops on the trail, newest first. */
export function TrailPanel({
  open,
  onClose,
  visited,
  model,
  selectedId,
  onJump,
}: {
  open: boolean
  onClose: () => void
  visited: string[]
  model: TreeModel
  selectedId: string | null
  onJump: (id: string) => void
}) {
  if (!open) return null
  const stops = visited.map((id) => model.byId.get(id)).filter(Boolean)

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-l border-border bg-card/60">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Footprints className="h-4 w-4 text-muted-foreground" />
          The trail
        </span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Close trail"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="rh-scroll flex-1 overflow-y-auto p-1.5">
        {stops.length === 0 ? (
          <p className="px-2 py-3 text-xs leading-relaxed text-muted-foreground">
            As you open findings, your path shows up here so you can retrace it.
          </p>
        ) : (
          <ol className="space-y-0.5">
            {stops.map((n, i) => (
              <li key={`${n!.recordId}-${i}`}>
                <button
                  onClick={() => onJump(n!.recordId)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    selectedId === n!.recordId
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                  )}
                >
                  <LensDot lens={n!.data.lens} />
                  <span className="truncate">{short(n!.data.title)}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  )
}
