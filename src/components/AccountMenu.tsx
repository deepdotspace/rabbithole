import { useEffect, useRef, useState } from 'react'
import { useAuth, useUser, signOut, AuthOverlay } from 'deepspace'
import { LogOut } from 'lucide-react'
import { Button, Avatar, AvatarImage, AvatarFallback } from '@/components/ui'

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
        {showAuth && <AuthOverlay onClose={() => setShowAuth(false)} providers={['google', 'github']} />}
      </>
    )
  }

  const name = user?.name ?? 'You'
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center rounded-full ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-border"
      >
        <Avatar className="h-8 w-8">
          {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={name} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
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
