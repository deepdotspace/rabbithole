import { useEffect, useRef, useState } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The telling dial — how findings are narrated, from plain to speculative.
 * Three discrete modes in a tidy popover (a raw gradient slider read as clutter
 * in the header). Only changes narration style; sources are always real + cited.
 */
const MODES = [
  { id: 'straight', label: 'Straight', tone: 15, blurb: 'Plain and factual. Just what the source says.' },
  { id: 'balanced', label: 'Balanced', tone: 50, blurb: 'The fact, plus why it matters to the question.' },
  { id: 'deep', label: 'Deep end', tone: 85, blurb: 'Connect the dots and hint where the thread leads.' },
] as const

export function modeForTone(tone: number): (typeof MODES)[number] {
  if (tone <= 33) return MODES[0]
  if (tone <= 66) return MODES[1]
  return MODES[2]
}

export function TellingControl({ tone, onChange }: { tone: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = modeForTone(tone)

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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary',
          open && 'bg-secondary',
        )}
        aria-label="Telling — narration style"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="hidden text-muted-foreground sm:inline">Telling:</span>
        <span className="text-foreground">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            How findings are told
          </p>
          {MODES.map((m) => {
            const active = m.id === current.id
            return (
              <button
                key={m.id}
                onClick={() => {
                  onChange(m.tone)
                  setOpen(false)
                }}
                className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-secondary"
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  {active && <Check className="h-4 w-4 text-primary" />}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-sm font-medium', active ? 'text-foreground' : 'text-foreground/90')}>
                    {m.label}
                  </span>
                  <span className="block text-xs leading-snug text-muted-foreground">{m.blurb}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
