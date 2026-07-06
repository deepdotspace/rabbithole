import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useQuery } from 'deepspace'
import { ArrowRight, Clock, Share2, Trash2, Shovel } from 'lucide-react'
import type { HoleRecord } from '../types'
import { LENSES, PULLABLE_LENSES } from '../lenses'
import { callAction } from '../lib/actions'
import { AccountMenu } from '../components/AccountMenu'
import { SignInOverlay } from '../components/SignInOverlay'
import { timeAgo } from '../lib/time'
import { Button, useToast, ConfirmModal } from '@/components/ui'

const SAMPLE_QUESTIONS = [
  'Why did the Bronze Age civilizations collapse?',
  'How do fireflies actually glow?',
  'What really happened to the Roanoke colony?',
  'Why is deep sleep so hard to fake?',
  'How did the printing press change Europe?',
]

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
  const inputRef = useRef<HTMLInputElement>(null)

  const digs = (records as HoleRecord[]).filter((h) => h.data.ownerId === userId)

  async function startDigging() {
    const q = question.trim()
    if (!q) return
    if (!isSignedIn) {
      setShowAuth(true)
      return
    }
    setCreating(true)
    const res = await callAction<{ holeId: string }>('createHole', { question: q, tone: 50 })
    setCreating(false)
    if (res.success && res.data) {
      navigate(`/dig/${res.data.holeId}`)
    } else {
      error('Could not start', res.error ?? 'Please try again.')
    }
  }

  function fillSample(q: string) {
    setQuestion(q)
    inputRef.current?.focus()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    const res = await callAction('deleteHole', { holeId: pendingDelete.recordId })
    setDeleting(false)
    setPendingDelete(null)
    if (res.success) success('Dig deleted', 'That trail and every finding on it are gone.')
    else error('Could not delete', res.error ?? 'Please try again.')
  }

  return (
    <div className="relative h-full overflow-y-auto rh-scroll">
      {/* Chrome — slim, custom. No default nav bar. */}
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <SpiralMark className="h-7 w-7" spin />
            <span className="font-serif text-lg tracking-tight text-foreground">RabbitHole</span>
          </button>
          <AccountMenu />
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-5 pb-24">
        {/* Hero — the composer sits at the mouth of the hole. */}
        <section className="relative pt-16 sm:pt-24">
          <HoleVortex />

          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              A research spiral you can actually navigate
            </span>

            <h1 className="mt-5 text-balance font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Go down the
              <br />
              <span className="relative inline-block">
                rabbit hole
                <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
              </span>
              <span className="text-muted-foreground">.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
              Ask a question, then pull threads to dig deeper. Every pull nests real findings
              underneath the last — so the spiral becomes a trail you can trace, not forty lost tabs.
            </p>

            <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[0_8px_40px_rgba(0,0,0,0.4)] ring-1 ring-primary/10 transition focus-within:ring-primary/30">
              <Shovel className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && startDigging()}
                placeholder="What are you curious about?"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button size="default" loading={creating} onClick={startDigging} className="shrink-0 gap-1.5">
                Start digging
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Playful example prompts — click to fill. */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              {SAMPLE_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => fillSample(q)}
                  className="rounded-full border border-border/70 bg-card/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Lens legend. */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="text-foreground/60">Dig with</span>
              {PULLABLE_LENSES.map((id) => (
                <span key={id} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LENSES[id].color }} />
                  {LENSES[id].label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Your digs */}
        <section className="relative z-10 mt-20">
          {isSignedIn && digs.length > 0 && (
            <>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Your digs
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {digs.map((h) => (
                  <article
                    key={h.recordId}
                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(0,0,0,0.4)]"
                    onClick={() => navigate(`/dig/${h.recordId}`)}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
                      style={{ background: 'var(--lens-exa-soft)' }}
                    />
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
                        aria-label="Delete dig"
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

          {isSignedIn && digs.length === 0 && (
            <div className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No digs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask a question above, or try one of these:
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {SAMPLE_QUESTIONS.slice(0, 2).map((q) => (
                  <button
                    key={q}
                    onClick={() => fillSample(q)}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSignedIn && (
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { t: 'Ask anything', d: 'A question seeds the root of your dig.' },
                { t: 'Pull a thread', d: 'Each pull fetches real, cited findings and nests them underneath.' },
                { t: 'Trace it back', d: 'Breadcrumbs and the trail keep the whole spiral navigable.' },
              ].map((s, i) => (
                <div key={s.t} className="rounded-xl border border-border bg-card p-4">
                  <span className="font-serif text-lg text-primary">{`0${i + 1}`}</span>
                  <h3 className="mt-1 text-sm font-medium text-foreground">{s.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showAuth && <SignInOverlay onClose={() => setShowAuth(false)} />}
      <ConfirmModal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={pendingDelete ? `Delete '${pendingDelete.data.title}'?` : 'Delete dig?'}
        description="This removes the whole dig — every finding on the trail is gone. This cannot be undone."
        confirmText="Delete dig"
        variant="destructive"
        loading={deleting}
      />
    </div>
  )
}

/** The spiral rabbit-hole mark, optionally slowly spinning. */
function SpiralMark({ className, spin }: { className?: string; spin?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <g className={spin ? 'rh-vortex-spin' : undefined} style={{ transformOrigin: '16px 16px' }}>
        <path
          d="M16 5a11 11 0 1 0 11 11 8.5 8.5 0 1 1-8.5-8.5 6 6 0 1 0 6 6 3.5 3.5 0 1 1-3.5-3.5"
          fill="none"
          stroke="var(--lens-exa)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  )
}

/** Big hypnotic tunnel behind the hero — nested rotated ellipses receding to a glowing core. */
function HoleVortex() {
  const rings = Array.from({ length: 11 })
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-4 z-0 flex justify-center overflow-hidden">
      <svg viewBox="-260 -260 520 520" className="h-[560px] w-[560px] max-w-none opacity-70">
        <defs>
          <radialGradient id="rh-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--lens-exa)" stopOpacity="0.35" />
            <stop offset="35%" stopColor="var(--lens-exa)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--color-background)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="rh-vortex-core" r="120" fill="url(#rh-core)" />
        <g className="rh-vortex-spin">
          {rings.map((_, i) => {
            const r = 250 - i * 21
            const rot = i * 15
            const op = 0.34 - i * 0.026
            return (
              <ellipse
                key={i}
                rx={r}
                ry={r * 0.66}
                fill="none"
                stroke="var(--lens-exa)"
                strokeWidth={1.1}
                opacity={Math.max(op, 0.04)}
                transform={`rotate(${rot})`}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}
