import type { NavigateFunction } from 'react-router-dom'

/**
 * Middleware context passed to each middleware function.
 */
export interface MiddlewareContext {
  /** Current authenticated user data (if available) */
  user: { id: number; username: string; email: string } | null
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean
  /** Navigate to a new route */
  navigate: NavigateFunction
  /** Whether we're on a public route (login/register) */
  isPublicRoute: boolean
}

/**
 * A middleware function that can either:
 * - Allow the request to pass through (return undefined)
 * - Redirect to another route (return a path string)
 * - Cancel the request (return '__cancel__')
 */
export type MiddlewareFunction = (
  ctx: MiddlewareContext,
  next: () => void,
) => void | string | symbol

// Sentinel value to indicate cancellation
export const CANCEL = Symbol('cancel')

/**
 * Check if the user is authenticated. If not, redirect to login.
 * If already on a public route (login/register), allow through.
 */
export function requireAuth(ctx: MiddlewareContext): void | string | symbol {
  if (ctx.isAuthenticated) {
    // User is logged in — allow through
    return
  }

  // On public routes (login/register) without auth — allow through
  if (ctx.isPublicRoute) {
    return
  }

  // Not authenticated and not on a public route — redirect to login
  return '/login'
}

/**
 * Check if the user is NOT authenticated. If they are, redirect to home.
 * This is the inverse of requireAuth — used to protect public-only routes.
 */
export function requireGuest(ctx: MiddlewareContext): void | string | symbol {
  if (!ctx.isAuthenticated) {
    // Not logged in — allow through (public route)
    return
  }

  // Already authenticated — redirect to home
  return '/'
}
