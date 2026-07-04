import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useQuery, useMutations } from 'deepspace'
import { ArrowLeft, Share2, Check, Footprints } from 'lucide-react'
import type { Hole, HoleRecord, Node, NodeRecord } from '../../types'
import type { LensId } from '../../lenses'
import { lensOf } from '../../lenses'
import { buildTree } from '../../lib/tree'
import { callAction } from '../../lib/actions'
import { AccountMenu } from '../../components/AccountMenu'
import { Breadcrumb } from '../../components/Breadcrumb'
import { ViewToggle, type BoardView } from '../../components/ViewToggle'
import { ToneDial } from '../../components/ToneDial'
import { OutlineView } from '../../components/OutlineView'
import { ColumnsView } from '../../components/ColumnsView'
import { TrailPanel } from '../../components/TrailPanel'
import { Button, useToast } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function HolePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { isSignedIn, userId } = useAuth()
  const { success, error, info } = useToast()

  const { records: holeRecords, status: holeStatus } = useQuery<Hole>('holes')
  const { records: nodeRecords } = useQuery<Node>('nodes', { where: { holeId: id } })
  const holePut = useMutations<Hole>('holes')
  const nodePut = useMutations<Node>('nodes')

  const hole = (holeRecords as HoleRecord[]).find((h) => h.recordId === id)
  const model = useMemo(() => buildTree(nodeRecords as NodeRecord[]), [nodeRecords])

  const canDig = Boolean(isSignedIn && hole && hole.data.ownerId === userId)

  const [view, setView] = useState<BoardView>('outline')
  const [tone, setTone] = useState(40)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [diggingId, setDiggingId] = useState<string | null>(null)
  const [visited, setVisited] = useState<string[]>([])
  const [trailOpen, setTrailOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Seed tone from the hole once it loads.
  const toneSeeded = useRef(false)
  useEffect(() => {
    if (hole && !toneSeeded.current) {
      setTone(typeof hole.data.tone === 'number' ? hole.data.tone : 40)
      toneSeeded.current = true
    }
  }, [hole])

  // Default selection to the root question.
  useEffect(() => {
    if (!selectedId && model.root) select(model.root.recordId)
  }, [model.root?.recordId])

  // Persist tone (debounced) for the owner.
  const toneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function changeTone(v: number) {
    setTone(v)
    if (!canDig) return
    if (toneTimer.current) clearTimeout(toneTimer.current)
    toneTimer.current = setTimeout(() => {
      holePut.put(id, { tone: v }).catch(() => {})
    }, 600)
  }

  function select(nodeId: string) {
    setSelectedId(nodeId)
    setVisited((prev) => [nodeId, ...prev.filter((x) => x !== nodeId)].slice(0, 40))
  }

  async function onPull(nodeId: string, lens: LensId) {
    if (!canDig) return
    setDiggingId(nodeId)
    // Make sure the parent is expanded so new findings are visible.
    const parent = model.byId.get(nodeId)
    if (parent?.data.collapsed) nodePut.put(nodeId, { collapsed: false }).catch(() => {})
    const res = await callAction<{ created?: unknown[]; note?: string }>('pullThread', {
      holeId: id,
      parentId: nodeId,
      lens,
      tone,
    })
    setDiggingId(null)
    if (!res.success) {
      error('The thread went cold', res.error ?? 'Try another lens.')
      return
    }
    const created = res.data?.created ?? []
    if (created.length === 0) {
      info('Nothing new down there', `${lensOf(lens).label} turned up no fresh findings. Try another lens.`)
    } else {
      select(nodeId)
      success(`Pulled ${created.length} finding${created.length === 1 ? '' : 's'}`, `via ${lensOf(lens).label}`)
    }
  }

  function onToggleCollapse(nodeId: string, next: boolean) {
    nodePut.put(nodeId, { collapsed: next }).catch(() => {})
  }

  async function onToggleShare() {
    if (!hole) return
    const next = hole.data.visibility !== 'shared'
    const res = await callAction('shareHole', { holeId: id, shared: next })
    if (!res.success) {
      error('Could not update sharing', res.error ?? 'Try again.')
      return
    }
    if (next) {
      await copyLink()
      success('Link copied', 'Anyone with the link can now follow this trail.')
    } else {
      success('Sharing turned off', 'This hole is private again.')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard may be blocked; the URL is still shareable */
    }
  }

  // ---- Loading / not-found ----
  if (holeStatus === 'loading' && !hole) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="rh-dig-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: '0ms' }} />
          <span className="rh-dig-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: '150ms' }} />
          <span className="rh-dig-dot h-1.5 w-1.5 rounded-full bg-primary" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    )
  }

  if (!hole) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl text-foreground">This hole isn't here</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          It may be private, or the link may be wrong.
          {!isSignedIn && ' If it belongs to you, sign in to open it.'}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to your holes
          </Button>
          {!isSignedIn && <AccountMenu />}
        </div>
      </div>
    )
  }

  const shared = hole.data.visibility === 'shared'
  const path = selectedId ? model.pathTo(selectedId) : model.root ? [model.root.recordId] : []

  return (
    <div className="flex h-full flex-col">
      {/* Top strip — the app's chrome. */}
      <header className="flex items-center gap-3 border-b border-border px-3 py-2 sm:px-4">
        <button
          onClick={() => navigate('/')}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Back to your holes"
        >
          <ArrowLeft className="h-4 w-4" />
          <BurrowMark />
        </button>

        <div className="min-w-0 flex-1">
          <Breadcrumb path={path} byId={model.byId} onJump={select} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center rounded-lg border border-border bg-card px-2.5 py-1 md:flex">
            <ToneDial value={tone} onChange={changeTone} />
          </div>
          <ViewToggle view={view} onChange={setView} />
          {canDig && (
            <Button
              variant={shared ? 'secondary' : 'outline'}
              size="sm"
              onClick={onToggleShare}
              className="gap-1.5"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
              <span className="hidden lg:inline">{shared ? 'Shared' : 'Share'}</span>
            </Button>
          )}
          <button
            onClick={() => setTrailOpen((v) => !v)}
            className={cn(
              'rounded-lg border border-border p-1.5 transition-colors',
              trailOpen ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            aria-label="Toggle the trail"
            aria-pressed={trailOpen}
          >
            <Footprints className="h-4 w-4" />
          </button>
          <div className="hidden sm:block">
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Tone dial on small screens. */}
      <div className="flex items-center justify-center border-b border-border/60 py-1.5 md:hidden">
        <ToneDial value={tone} onChange={changeTone} />
      </div>

      {!canDig && (
        <div className="border-b border-border/60 bg-card/40 px-4 py-1.5 text-center text-xs text-muted-foreground">
          You're following someone else's trail — reading only. Start your own hole to dig.
        </div>
      )}

      {/* Board + trail. */}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-hidden">
          {view === 'outline' ? (
            <div className="h-full overflow-y-auto rh-scroll">
              <OutlineView
                model={model}
                canDig={canDig}
                selectedId={selectedId}
                diggingId={diggingId}
                onSelect={select}
                onPull={onPull}
                onToggleCollapse={onToggleCollapse}
              />
            </div>
          ) : (
            <ColumnsView
              model={model}
              canDig={canDig}
              selectedId={selectedId}
              diggingId={diggingId}
              onSelect={select}
              onPull={onPull}
            />
          )}
        </div>

        <TrailPanel
          open={trailOpen}
          onClose={() => setTrailOpen(false)}
          visited={visited}
          model={model}
          selectedId={selectedId}
          onJump={select}
        />
      </div>
    </div>
  )
}

function BurrowMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
      <path
        d="M16 5a11 11 0 1 0 11 11 8.5 8.5 0 1 1-8.5-8.5 6 6 0 1 0 6 6 3.5 3.5 0 1 1-3.5-3.5"
        fill="none"
        stroke="var(--lens-exa)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
