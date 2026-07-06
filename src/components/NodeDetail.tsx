import { useState } from 'react'
import { Link2, CornerDownRight } from 'lucide-react'
import type { NodeRecord } from '../types'
import type { TreeModel } from '../lib/tree'
import { DEFAULT_LENS, type LensId } from '../lenses'
import { LensChip, LensDot } from './LensChip'
import { SourceList } from './SourceList'
import { PullMenu } from './PullMenu'
import { FocusTag } from './FocusTag'

function short(s: string, n = 44): string {
  const t = (s ?? '').trim().replace(/\s+/g, ' ')
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

/** Connections: what points here, and what this finding points back to. */
function Connections({
  record,
  model,
  onJump,
}: {
  record: NodeRecord
  model: TreeModel
  onJump: (id: string) => void
}) {
  const backlinks = model.backlinksTo(record.recordId)
  const refs = (record.data.refs ?? []).filter((id) => model.byId.has(id))
  if (backlinks.length === 0 && refs.length === 0) return null

  return (
    <div className="mt-3 space-y-2 border-t border-border/60 pt-2.5">
      {backlinks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
            <Link2 className="h-3 w-3" />
            {backlinks.length} finding{backlinks.length === 1 ? '' : 's'} mention this
          </span>
          {backlinks.slice(0, 4).map((id) => {
            const n = model.byId.get(id)
            if (!n) return null
            return (
              <button
                key={id}
                onClick={() => onJump(id)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <LensDot lens={n.data.lens} />
                {short(n.data.title, 30)}
              </button>
            )
          })}
        </div>
      )}
      {refs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
            <CornerDownRight className="h-3 w-3" />
            Connects back to
          </span>
          {refs.map((id) => {
            const n = model.byId.get(id)
            if (!n) return null
            return (
              <button
                key={id}
                onClick={() => onJump(id)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <LensDot lens={n.data.lens} />
                {short(n.data.title, 30)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Full detail for one node: narration, sources, connections, and the pull gesture. */
export function NodeDetail({
  record,
  model,
  canDig,
  digging,
  onPull,
  onJump,
  pullAlign = 'left',
}: {
  record: NodeRecord
  model: TreeModel
  canDig: boolean
  digging: boolean
  onPull: (lens: LensId, focus?: string) => void
  onJump: (id: string) => void
  pullAlign?: 'left' | 'right'
}) {
  const isRoot = record.data.lens === 'root'
  const childCount = model.childrenOf(record.recordId).length
  const [focus, setFocus] = useState('')

  function pull(lens: LensId) {
    onPull(lens, focus.trim())
    setFocus('')
  }

  return (
    <div>
      {record.data.focus && !isRoot && (
        <div className="mb-2">
          <FocusTag focus={record.data.focus} />
        </div>
      )}
      {record.data.body && (
        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
          {record.data.body}
        </p>
      )}
      {isRoot && childCount === 0 && (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Pull a thread to start digging. Each pull nests real findings underneath, and the board
          grows into a trail you can trace back.
        </p>
      )}

      <SourceList sources={record.data.sources ?? []} />
      <Connections record={record} model={model} onJump={onJump} />

      {canDig && (
        <div className="mt-3 space-y-2">
          <div className="flex items-stretch gap-1.5">
            <input
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !digging) pull(DEFAULT_LENS)
              }}
              placeholder={isRoot ? 'Dig into a specific angle (optional)' : 'Follow a specific angle (optional)'}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
            />
            <PullMenu
              onPull={pull}
              digging={digging}
              align={pullAlign}
              label={focus.trim() ? 'Dig in' : isRoot ? 'Pull first thread' : 'Dig deeper'}
            />
          </div>
          {childCount > 0 && (
            <span className="inline-flex items-center text-xs text-muted-foreground">
              <LensChip lens={record.data.lens} size="xs" className="mr-1" />
              {childCount} thread{childCount === 1 ? '' : 's'} pulled
            </span>
          )}
        </div>
      )}
    </div>
  )
}
