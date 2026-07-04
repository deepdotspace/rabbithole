/**
 * The telling dial — how each finding is narrated, from plain to speculative.
 * Only changes narration style; sources are always real and cited.
 */
export function ToneDial({
  value,
  onChange,
  compact,
}: {
  value: number
  onChange: (v: number) => void
  compact?: boolean
}) {
  const label = value <= 33 ? 'Straight' : value <= 66 ? 'Balanced' : 'Deep end'
  return (
    <div className="flex items-center gap-2.5">
      {!compact && (
        <span className="text-[11px] font-medium text-muted-foreground">Straight</span>
      )}
      <div className="flex flex-col items-center gap-0.5">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rh-tone w-28"
          aria-label="Telling — narration style"
        />
        <span className="text-[10px] font-medium uppercase tracking-wide text-foreground/80">
          {label}
        </span>
      </div>
      {!compact && (
        <span className="text-[11px] font-medium text-muted-foreground">Deep end</span>
      )}
    </div>
  )
}
