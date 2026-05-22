import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../useAuth'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
)

describe('useAuth', () => {
  test('login mutation exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.login).toBeDefined()
  })

  test('register mutation exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.register).toBeDefined()
  })

  test('logout function exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.logout).toBeDefined()
  })

  test('currentUser query exists', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.currentUser).toBeDefined()
  })
})
