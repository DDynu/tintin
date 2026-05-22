import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { chatApi } from './api/client'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { Sidebar } from './components/Sidebar'
import type { Chat } from './types'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth()
  if (currentUser.isLoading) return <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">Loading...</div>
  if (!currentUser.data) return <Navigate to="/login" replace />
  return <>{children}</>
}

function MainApp() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    chatApi.listChats().then(setChats)
  }, [])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Sidebar
              chats={chats}
              selectedChatId={selectedChatId}
              onSelect={setSelectedChatId}
            />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default function App() {
  return <MainApp />
}
