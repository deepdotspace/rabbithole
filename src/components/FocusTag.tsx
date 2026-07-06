import { Crosshair } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shows the "dig into a specific angle" text a reader typed for a pull, so the
 * findings it produced carry the question that summoned them.
 */
export function FocusTag({ focus, className }: { focus?: string; className?: string }) {
  const f = (focus ?? '').trim()
  if (!f) return null
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary',
        className,
      )}
    >
      <Crosshair className="h-3 w-3 shrink-0" />
      <span className="truncate">{f}</span>
    </span>
  )
}
