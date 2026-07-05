import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * A proper avatar: an on-brand initials disc that the profile photo fades in
 * over — and only once it has actually loaded. The scaffold's Avatar rendered
 * the <img> and the fallback text at the same time, which is what caused the
 * doubled / overlapping initials.
 */
function initialsOf(name?: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Warm amber gradient keyed to the name so different people read differently. */
function gradientFor(name?: string): string {
  const hues = [22, 30, 14, 38, 8] // ember-range ambers/oranges
  let h = 0
  for (const c of name ?? 'x') h = (h + c.charCodeAt(0)) % hues.length
  const base = hues[h]
  return `linear-gradient(135deg, hsl(${base} 85% 55%), hsl(${base - 8} 80% 42%))`
}

export function UserAvatar({
  name,
  imageUrl,
  size = 32,
  className,
}: {
  name?: string
  imageUrl?: string | null
  size?: number
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(imageUrl) && !failed

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full',
        className,
      )}
      style={{ width: size, height: size, background: gradientFor(name) }}
    >
      <span
        className="font-semibold leading-none text-white"
        style={{ fontSize: Math.round(size * 0.4), textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}
      >
        {initialsOf(name)}
      </span>
      {showImage && (
        <img
          src={imageUrl as string}
          alt={name ?? 'Account'}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-200',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </span>
  )
}
