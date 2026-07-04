import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="mb-2 font-serif text-4xl text-foreground">404</h1>
      <p className="mb-6 text-muted-foreground">This path doesn't lead anywhere.</p>
      <Link
        to="/"
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Back to the surface
      </Link>
    </div>
  )
}
