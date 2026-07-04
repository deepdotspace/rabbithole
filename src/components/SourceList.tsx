import { ExternalLink } from 'lucide-react'
import type { Source } from '../types'

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Real, clickable sources behind a finding. The trail is always backed by links. */
export function SourceList({ sources }: { sources: Source[] }) {
  if (!sources?.length) return null
  return (
    <ul className="mt-2 space-y-1">
      {sources.map((s, i) => (
        <li key={`${s.url}-${i}`}>
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
            <span className="truncate">{s.title || hostOf(s.url)}</span>
            <span className="shrink-0 text-[10px] text-muted-foreground/70">{hostOf(s.url)}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
