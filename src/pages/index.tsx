import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useQuery, AuthOverlay } from 'deepspace'
import { ArrowRight, Clock, Share2, Trash2 } from 'lucide-react'
import type { HoleRecord } from '../types'
import { LENSES, PULLABLE_LENSES } from '../lenses'
import { callAction } from '../lib/actions'
import { AccountMenu } from '../components/AccountMenu'
import { timeAgo } from '../lib/time'
import { Button, useToast, ConfirmModal } from '@/components/ui'

export default function Home() {
  const navigate = useNavigate()
  const { isSignedIn, userId } = useAuth()
  const { success, error } = useToast()
  const { records } = useQuery<HoleRecord['data']>('holes', { orderBy: 'updatedAt', orderDir: 'desc' })

  const [question, setQuestion] = useState('')
  const [creating, setCreating] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<HoleRecord | null>(null)
  const [deleting, setDeleting] = useState(false)

  const holes = (records as HoleRecord[]).filter((h) => h.data.ownerId === userId)

  async function startDigging() {
    const q = question.trim()
    if (!q) return
    if (!isSignedIn) {
      setShowAuth(true)
      return
    }
    setCreating(true)
    const res = await callAction<{ holeId: string }>('createHole', { question: q, tone: 40 })
    setCreating(false)
    if (res.success && res.data) {
      navigate(`/hole/${res.data.holeId}`)
    } else {
      error('Could not start', res.error ?? 'Please try again.')
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    const res = await callAction('deleteHole', { holeId: pendingDelete.recordId })
    setDeleting(false)
    setPendingDelete(null)
    if (res.success) success('Hole filled in', 'The investigation was deleted.')
    else error('Could not delete', res.error ?? 'Please try again.')
  }

  return (
    <div className="h-full overflow-y-auto rh-scroll">
      {/* Chrome — slim, custom. No default nav bar. */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <BurrowMark />
            <span className="font-serif text-lg tracking-tight text-foreground">RabbitHole</span>
          </button>
          <AccountMenu />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24">
        {/* Hero + composer */}
        <section className="mx-auto max-w-2xl pt-16 text-center sm:pt-24">
          <h1 className="text-balance font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Go down the rabbit hole,
            <br />
            and keep the map.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
            Start with a question. Pull threads to dig deeper — each pull nests real findings
            underneath the last, so the spiral becomes a trail you can trace instead of forty lost tabs.
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-col gap-2.5 rounded-2xl border border-border bg-card p-2.5 shadow-[0_2px_20px_rgba(0,0,0,0.25)] sm:flex-row sm:items-stretch">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && startDigging()}
              placeholder="What are you curious about?"
              className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <Button size="lg" loading={creating} onClick={startDigging} className="shrink-0 gap-1.5">
              Start digging
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Lens legend — how digging stays varied. */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="text-foreground/70">Pull threads through:</span>
            {PULLABLE_LENSES.map((id) => (
              <span key={id} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LENSES[id].color }} />
                {LENSES[id].label}
              </span>
            ))}
          </div>
        </section>

        {/* Your holes */}
        <section className="mt-16">
          {isSignedIn && holes.length > 0 && (
            <>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Your holes
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {holes.map((h) => (
                  <article
                    key={h.recordId}
                    className="group relative flex cursor-pointer flex-col rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                    onClick={() => navigate(`/hole/${h.recordId}`)}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground">
                        {h.data.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingDelete(h)
                        }}
                        className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-secondary hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete hole"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                      {h.data.rootQuestion}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(h.updatedAt)}
                      </span>
                      {h.data.visibility === 'shared' && (
                        <span className="inline-flex items-center gap-1 text-foreground/70">
                          <Share2 className="h-3 w-3" />
                          Shared
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {isSignedIn && holes.length === 0 && (
            <div className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No holes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask a question above and pull your first thread.
              </p>
            </div>
          )}

          {!isSignedIn && (
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { t: 'Ask anything', d: 'A question seeds the root of your hole.' },
                { t: 'Pull a thread', d: 'Each pull fetches real findings and nests them underneath.' },
                { t: 'Trace it back', d: 'Breadcrumbs and the trail keep the whole spiral navigable.' },
              ].map((s, i) => (
                <div key={s.t} className="rounded-xl border border-border bg-card p-4">
                  <span className="text-xs font-medium text-primary">{`0${i + 1}`}</span>
                  <h3 className="mt-1 text-sm font-medium text-foreground">{s.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} providers={['google', 'github']} />}
      <ConfirmModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete ? `Delete '${pendingDelete.data.title}'?` : 'Delete hole?'}
        description="This fills in the whole hole — every finding on the trail is removed. This cannot be undone."
        confirmText="Delete hole"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}

function BurrowMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
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
