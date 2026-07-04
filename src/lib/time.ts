/** Record timestamps arrive as strings (epoch-ms or ISO). Coerce to ms safely. */
export function toMs(v: string | number | undefined | null): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const n = Number(v)
  if (Number.isFinite(n) && n > 0) return n
  const d = Date.parse(v)
  return Number.isFinite(d) ? d : 0
}

export function timeAgo(v: string | number): string {
  const ms = toMs(v)
  if (!ms) return ''
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d < 7 ? `${d}d ago` : new Date(ms).toLocaleDateString()
}
