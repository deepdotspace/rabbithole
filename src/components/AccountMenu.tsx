import { useEffect, useRef, useState } from 'react'
import { useAuth, useUser, signOut } from 'deepspace'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { UserAvatar } from './UserAvatar'
import { SignInOverlay } from './SignInOverlay'

/** Sign-in trigger when signed out; avatar + sign-out when signed in. */
export function AccountMenu() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const [showAuth, setShowAuth] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (!isLoaded) return <div className="h-8 w-8 animate-pulse rounded-full bg-secondary" />

  if (!isSignedIn) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setShowAuth(true)}>
          Sign in
        </Button>
        {showAuth && <SignInOverlay onClose={() => setShowAuth(false)} />}
      </>
    )
  }

  const name = user?.name ?? 'You'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded-full ring-1 ring-border/70 transition hover:ring-primary/40"
        aria-label="Account"
      >
        <UserAvatar name={name} imageUrl={user?.imageUrl} size={32} />
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <UserAvatar name={name} imageUrl={user?.imageUrl} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
