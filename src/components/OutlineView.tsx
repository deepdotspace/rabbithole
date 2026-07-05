import { ChevronRight } from 'lucide-react'
import type { NodeRecord } from '../types'
import type { TreeModel } from '../lib/tree'
import type { LensId } from '../lenses'
import { LensChip } from './LensChip'
import { NodeDetail } from './NodeDetail'
import { cn } from '@/lib/utils'

interface OutlineProps {
  model: TreeModel
  canDig: boolean
  selectedId: string | null
  diggingId: string | null
  onSelect: (id: string) => void
  onPull: (nodeId: string, lens: LensId, focus?: string) => void
  onToggleCollapse: (nodeId: string, next: boolean) => void
}

function Row({ record, depth, ...p }: OutlineProps & { record: NodeRecord; depth: number }) {
  const { model, selectedId, diggingId, canDig, onSelect, onPull, onToggleCollapse } = p
  const children = model.childrenOf(record.recordId)
  const hasChildren = children.length > 0
  const collapsed = Boolean(record.data.collapsed)
  const isRoot = record.data.lens === 'root'
  const selected = selectedId === record.recordId
  const backlinks = model.backlinksTo(record.recordId).length

  return (
    <div>
      <div
        className={cn(
          'group flex items-start gap-1.5 rounded-lg px-1.5 py-1.5 transition-colors',
          selected ? 'bg-secondary' : 'hover:bg-secondary/50',
        )}
      >
        <button
          onClick={() => hasChildren && onToggleCollapse(record.recordId, !collapsed)}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors',
            hasChildren ? 'hover:bg-border hover:text-foreground' : 'invisible',
          )}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronRight className={cn('h-4 w-4 transition-transform', !collapsed && 'rotate-90')} />
        </button>

        <button onClick={() => onSelect(record.recordId)} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            {!isRoot && <LensChip lens={record.data.lens} size="xs" />}
            <span
              className={cn(
                'truncate',
                isRoot ? 'text-[15px] font-semibold text-foreground' : 'text-sm text-foreground/90',
              )}
            >
              {record.data.title}
            </span>
          </div>
          {!selected && record.data.body && (
            <p className="mt-0.5 truncate pl-0 text-xs text-muted-foreground">{record.data.body}</p>
          )}
        </button>

        <div className="mt-0.5 flex shrink-0 items-center gap-2">
          {diggingId === record.recordId && (
            <span className="flex items-center gap-0.5" aria-label="Digging">
              <span className="rh-dig-dot h-1 w-1 rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
              <span className="rh-dig-dot h-1 w-1 rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
              <span className="rh-dig-dot h-1 w-1 rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
            </span>
          )}
          {backlinks > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground" title={`${backlinks} findings mention this`}>
              {backlinks}↩
            </span>
          )}
          {hasChildren && collapsed && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {children.length}
            </span>
          )}
        </div>
      </div>

      {selected && (
        <div className="ml-6 mb-1 mr-1 rounded-lg border border-border bg-card/60 px-3 py-2.5">
          <NodeDetail
            record={record}
            model={model}
            canDig={canDig}
            digging={diggingId === record.recordId}
            onPull={(lens, focus) => onPull(record.recordId, lens, focus)}
            onJump={onSelect}
          />
        </div>
      )}

      {hasChildren && !collapsed && (
        <div className="ml-3 border-l border-border/70 pl-2">
          {children.map((c) => (
            <Row key={c.recordId} record={c} depth={depth + 1} {...p} />
          ))}
        </div>
      )}
    </div>
  )
}

export function OutlineView(props: OutlineProps) {
  const root = props.model.root
  if (!root) return null
  return (
    <div className="mx-auto max-w-3xl px-3 py-4 sm:px-5">
      <Row record={root} depth={0} {...props} />
    </div>
  )
}
