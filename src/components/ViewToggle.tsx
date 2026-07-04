import { ListTree, Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BoardView = 'outline' | 'columns'

/** Switch between the two renderings of the same tree. */
export function ViewToggle({ view, onChange }: { view: BoardView; onChange: (v: BoardView) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
      {(
        [
          { id: 'outline', label: 'Outline', icon: ListTree },
          { id: 'columns', label: 'Columns', icon: Columns3 },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          aria-pressed={view === id}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            view === id
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
