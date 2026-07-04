import { ChevronRight } from 'lucide-react'
import type { NodeRecord } from '../types'
import { LensDot } from './LensChip'
import { cn } from '@/lib/utils'

function short(s: string, n = 40): string {
  const t = s.trim().replace(/\s+/g, ' ')
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

/** The path from the root question to where you are. Click a crumb to jump back. */
export function Breadcrumb({
  path,
  byId,
  onJump,
}: {
  path: string[]
  byId: Map<string, NodeRecord>
  onJump: (id: string) => void
}) {
  const nodes = path.map((id) => byId.get(id)).filter((n): n is NodeRecord => Boolean(n))
  if (nodes.length === 0) return null
  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-x-auto rh-scroll" aria-label="Trail">
      {nodes.map((n, i) => {
        const isLast = i === nodes.length - 1
        return (
          <div key={n.recordId} className="flex shrink-0 items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
            <button
              onClick={() => onJump(n.recordId)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors hover:bg-secondary',
                isLast ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LensDot lens={n.data.lens} />
              {short(n.data.title, i === 0 ? 48 : 34)}
            </button>
          </div>
        )
      })}
    </nav>
  )
}
