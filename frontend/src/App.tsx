import { useState, createContext, useContext, type ReactNode } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { Home } from './components/Home'
import { ChatView } from './components/ChatView'

interface AppContext {
  showSidebar: boolean
  setShowSidebar: (show: boolean) => void
}

const Ctx = createContext<AppContext>({
  showSidebar: false,
  setShowSidebar: () => {},
})

export function useApp() {
  return useContext(Ctx)
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth()
  if (currentUser.isLoading) return <div className="min-h-screen bg-bg-deep text-text-primary flex items-center justify-center">Loading...</div>
  if (!localStorage.getItem('token')) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <Ctx.Provider value={{ showSidebar, setShowSidebar }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/chat/:id" element={<ChatView />} />
        </Route>
      </Routes>
    </Ctx.Provider>
  )
}

function MainLayout() {
  const { showSidebar, setShowSidebar } = useApp()
  const location = useLocation()
  const isChatView = location.pathname.startsWith('/chat/')

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar drawer - only on chat view */}
      {isChatView && (
        <>
          <div
            className={`
              fixed top-0 left-0 bottom-0 z-50
              md:relative md:z-0 md:w-72 md:shrink-0
              ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
              transition-transform duration-200 ease-out
            `}
          >
            <Home />
          </div>

          {/* Backdrop */}
          {showSidebar && (
            <div
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </>
      )}

      {/* Chat view - full height on desktop */}
      <div className="flex-1 h-full">
        <Outlet />
      </div>
    </div>
  )
}
