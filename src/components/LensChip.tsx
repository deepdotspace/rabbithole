import { lensOf, type LensId } from '../lenses'
import { cn } from '@/lib/utils'

/** A small color-coded tag naming the source lens a finding came from. */
export function LensChip({
  lens,
  size = 'sm',
  className,
}: {
  lens: LensId | string
  size?: 'xs' | 'sm'
  className?: string
}) {
  const l = lensOf(lens)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium leading-none',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
        className,
      )}
      style={{
        color: l.color,
        backgroundColor: `color-mix(in srgb, ${l.color} 14%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
      {l.label}
    </span>
  )
}

/** Just the colored dot — for compact rows and lists. */
export function LensDot({ lens, className }: { lens: LensId | string; className?: string }) {
  const l = lensOf(lens)
  return (
    <span
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: l.color }}
      title={l.label}
    />
  )
}
