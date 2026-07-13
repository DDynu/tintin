import { useState, createContext, useContext, type ReactNode, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { chatApi } from './api/client'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { Home } from './components/Home'
import { ChatView } from './components/ChatView'
import { Sidebar } from './components/Sidebar'
import { NewChatModal } from './components/NewChatModal'
import type { Chat } from './types'

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
  const [chats, setChats] = useState<Chat[]>([])

  const refreshChats = useCallback(() => {
    chatApi.listChats().then(setChats)
  }, [])

  return (
    <Ctx.Provider value={{ showSidebar, setShowSidebar }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <AuthGuard>
              <MainLayout refreshChats={refreshChats} chats={chats} setChats={setChats} />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/chat/:id" element={<ChatView refreshChats={refreshChats} />} />
        </Route>
      </Routes>
    </Ctx.Provider>
  )
}

function MainLayout({ refreshChats, chats }: { refreshChats: () => void; chats: Chat[]; setChats: React.Dispatch<React.SetStateAction<Chat[]>> }) {
  const { showSidebar, setShowSidebar } = useApp()
  const location = useLocation()
  const isChatView = location.pathname.startsWith('/chat/')
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)

  useEffect(() => {
    refreshChats()
  }, [refreshChats])

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar - always renders on desktop, drawer on mobile */}
      {(isChatView || location.pathname === '/') && (
        <>
          <div
            className={`
              md:relative md:z-0 md:w-72 md:shrink-0
              fixed top-0 left-0 bottom-0 z-50
              ${showSidebar ? 'translate-x-0' : '-translate-x-full md:block md:translate-x-0'}
              transition-transform duration-200 ease-out
            `}
          >
            <Sidebar
              chats={chats}
              selectedChatId={selectedChatId}
              onSelect={setSelectedChatId}
              isNewChat={() => setShowNewChat(true)}
            />
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

      {/* Page content */}
      <div className="flex-1 h-full">
        <Outlet />
      </div>

      {/* Floating modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={refreshChats}
          refresh={refreshChats}
        />
      )}
    </div>
  )
}
