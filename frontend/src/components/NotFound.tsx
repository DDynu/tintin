import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="min-h-screen bg-bg-deep text-text-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-6">
        <div className="text-7xl font-bold text-amber opacity-40">404</div>
        <div className="text-sm uppercase tracking-widest text-text-dim">Page Not Found</div>
        <div className="text-sm text-text-dim mt-2">The page you're looking for doesn't exist.</div>
        <Link
          to="/"
          className="mt-4 px-5 py-2 rounded-lg bg-amber text-bg-base text-sm font-medium hover:bg-amber-glow transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
