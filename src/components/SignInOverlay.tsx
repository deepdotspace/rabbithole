import { createPortal } from 'react-dom'
import { AuthOverlay } from 'deepspace'

/**
 * The SDK's AuthOverlay is fixed-positioned, but a `backdrop-filter` / `transform`
 * ancestor (our sticky, blurred headers) becomes its containing block and drags
 * it out of the viewport center. Portaling to <body> keeps it truly centered.
 */
export function SignInOverlay({ onClose }: { onClose: () => void }) {
  if (typeof document === 'undefined') return null
  return createPortal(<AuthOverlay onClose={onClose} providers={['google', 'github']} />, document.body)
}
