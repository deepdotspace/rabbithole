import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Shovel } from 'lucide-react'
import { PULLABLE_LENSES, lensOf, DEFAULT_LENS, type LensId } from '../lenses'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * The core gesture: pull a thread. Split control — the main button digs with
 * the last-used lens; the caret opens the lens picker so digging stays varied.
 */
export function PullMenu({
  onPull,
  digging,
  disabled,
  size = 'sm',
  label = 'Pull thread',
  align = 'left',
}: {
  onPull: (lens: LensId) => void
  digging?: boolean
  disabled?: boolean
  size?: 'sm' | 'default'
  label?: string
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const [lastLens, setLastLens] = useState<LensId>(DEFAULT_LENS)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const pull = (lens: LensId) => {
    setLastLens(lens)
    setOpen(false)
    onPull(lens)
  }

  const last = lensOf(lastLens)

  return (
    <div className="relative inline-flex" ref={ref}>
      <Button
        size={size}
        loading={digging}
        disabled={disabled || digging}
        onClick={() => pull(lastLens)}
        className="gap-1.5 rounded-r-none"
      >
        {!digging && <Shovel className="h-3.5 w-3.5" />}
        {digging ? 'Digging' : label}
        <span
          className="ml-0.5 hidden h-1.5 w-1.5 rounded-full sm:inline-block"
          style={{ backgroundColor: last.color }}
        />
      </Button>
      <Button
        size={size}
        disabled={disabled || digging}
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose a lens"
        className="rounded-l-none border-l border-primary-foreground/20 px-1.5"
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute top-full z-30 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Dig with
          </p>
          {PULLABLE_LENSES.map((id) => {
            const l = lensOf(id)
            return (
              <button
                key={id}
                onClick={() => pull(id)}
                className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    {l.label}
                    {id === DEFAULT_LENS && (
                      <span className="rounded bg-muted px-1 py-px text-[9px] font-normal uppercase tracking-wide text-muted-foreground">
                        default
                      </span>
                    )}
                  </span>
                  <span className="block text-xs leading-snug text-muted-foreground">{l.blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
