import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { MiddlewareContext, MiddlewareFunction } from './auth'
import { CANCEL } from './auth'

/**
 * MiddlewareProvider wraps route content and executes a chain of middleware
 * functions before allowing the children to render.
 *
 * This mirrors the React Router framework middleware pattern:
 * middleware runs in order, and each can redirect or cancel the chain.
 */
interface Props {
  /** Ordered list of middleware functions to execute */
  middleware: MiddlewareFunction[]
  /** Content to render if middleware allows */
  children: ReactNode
}

export function MiddlewareProvider({ middleware, children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser } = useAuth()

  const [blocked, setBlocked] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  const user = currentUser.data ?? null
  const isAuthenticated = !!user

  // Run middleware chain
  useEffect(() => {
    if (currentUser.isLoading) return // Wait for auth to resolve

    let cancelled = false

    const ctx: MiddlewareContext = {
      user,
      isAuthenticated,
      navigate,
      isPublicRoute: ['/login', '/register'].includes(location.pathname),
    }

    // Execute middleware chain sequentially
    let i = 0
    const runNext = () => {
      if (cancelled || blocked || redirectPath) return

      if (i >= middleware.length) {
        // All middleware passed — allow rendering
        return
      }

      const mw = middleware[i]
      i++

      const result = mw(ctx, runNext)

      if (typeof result === 'string') {
        // Middleware wants to redirect
        cancelled = true
        setRedirectPath(result)
      } else if (result === CANCEL) {
        // Middleware wants to cancel
        cancelled = true
        setBlocked(true)
      }
    }

    runNext()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.isSuccess, currentUser.data, navigate, location.pathname])

  // Handle redirect
  useEffect(() => {
    if (redirectPath) {
      navigate(redirectPath, { replace: true })
    }
  }, [redirectPath, navigate])

  if (blocked) {
    return null
  }

  if (currentUser.isLoading) {
    return (
      <div className="min-h-screen bg-bg-deep text-text-primary flex items-center justify-center">
        Loading...
      </div>
    )
  }

  return <>{children}</>
}
