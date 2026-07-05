import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Avatar({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary',
        className,
      )}
      {...props}
    />
  )
}

export function AvatarImage({ className, alt = '', ...props }: ComponentProps<'img'>) {
  // referrerPolicy=no-referrer lets Google/GitHub-hosted avatars load (they 403
  // when a referrer is sent), so the fallback initials don't leak through.
  return (
    <img
      className={cn('size-full object-cover', className)}
      alt={alt}
      referrerPolicy="no-referrer"
      {...props}
    />
  )
}

export function AvatarFallback({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      className={cn('text-sm font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}
