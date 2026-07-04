import { useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import type { NodeRecord } from '../types'
import type { TreeModel } from '../lib/tree'
import type { LensId } from '../lenses'
import { LensChip, LensDot } from './LensChip'
import { NodeDetail } from './NodeDetail'
import { cn } from '@/lib/utils'

interface ColumnsProps {
  model: TreeModel
  canDig: boolean
  selectedId: string | null
  diggingId: string | null
  onSelect: (id: string) => void
  onPull: (nodeId: string, lens: LensId) => void
}

function ColumnItem({
  record,
  model,
  active,
  onSelect,
  digging,
}: {
  record: NodeRecord
  model: TreeModel
  active: boolean
  onSelect: (id: string) => void
  digging: boolean
}) {
  const childCount = model.childrenOf(record.recordId).length
  const backlinks = model.backlinksTo(record.recordId).length
  return (
    <button
      onClick={() => onSelect(record.recordId)}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
        active ? 'bg-secondary' : 'hover:bg-secondary/50',
      )}
    >
      <LensDot lens={record.data.lens} className="mt-0.5 self-start" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[13px] leading-snug text-foreground/90">
          {record.data.title}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {digging && <span className="rh-dig-dot h-1.5 w-1.5 rounded-full bg-primary" />}
        {backlinks > 0 && (
          <span className="rounded-full bg-muted px-1 text-[9px] text-muted-foreground">{backlinks}↩</span>
        )}
        {childCount > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground/60" />}
      </span>
    </button>
  )
}

export function ColumnsView({ model, canDig, selectedId, diggingId, onSelect, onPull }: ColumnsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const root = model.root
  const selected = selectedId ? model.byId.get(selectedId) : root
  const path = selected ? model.pathTo(selected.recordId) : root ? [root.recordId] : []

  // Each column lists the children of a node on the path; the next path node is active.
  const columns: { parentId: string; children: NodeRecord[]; activeChildId?: string }[] = []
  for (let i = 0; i < path.length; i++) {
    const kids = model.childrenOf(path[i])
    if (kids.length > 0) columns.push({ parentId: path[i], children: kids, activeChildId: path[i + 1] })
  }

  // Keep the deepest column + detail in view as you drill.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' })
  }, [selectedId, columns.length])

  if (!root) return null

  return (
    <div ref={scrollRef} className="rh-scroll h-full overflow-x-auto">
      <div className="flex h-full min-w-max items-stretch gap-0">
        {columns.map((col) => {
          const parent = model.byId.get(col.parentId)
          return (
            <div key={col.parentId} className="flex h-full w-64 shrink-0 flex-col border-r border-border">
              <div className="flex items-center gap-1.5 border-b border-border/60 px-2.5 py-2">
                {parent && parent.data.lens !== 'root' ? (
                  <LensChip lens={parent.data.lens} size="xs" />
                ) : (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Question
                  </span>
                )}
                <span className="truncate text-xs text-muted-foreground">{parent?.data.title}</span>
              </div>
              <div className="rh-scroll flex-1 space-y-0.5 overflow-y-auto p-1.5">
                {col.children.map((c) => (
                  <ColumnItem
                    key={c.recordId}
                    record={c}
                    model={model}
                    active={col.activeChildId === c.recordId || selectedId === c.recordId}
                    onSelect={onSelect}
                    digging={diggingId === c.recordId}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Detail pane for the focused node. */}
        {selected && (
          <div className="flex h-full w-80 shrink-0 flex-col bg-card/40">
            <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-2">
              {selected.data.lens !== 'root' ? (
                <LensChip lens={selected.data.lens} size="xs" />
              ) : (
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Question
                </span>
              )}
            </div>
            <div className="rh-scroll flex-1 overflow-y-auto px-3 py-3">
              <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground">
                {selected.data.title}
              </h3>
              <NodeDetail
                record={selected}
                model={model}
                canDig={canDig}
                digging={diggingId === selected.recordId}
                onPull={(lens) => onPull(selected.recordId, lens)}
                onJump={onSelect}
                pullAlign="left"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
