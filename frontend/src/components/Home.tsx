import { useState, useEffect } from 'react'
import { chatApi } from '../api/client'
import { useApp } from '../App'
import type { Chat } from '../types'

export function Home() {
  const { showSidebar, setShowSidebar } = useApp()
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    chatApi.listChats().then(setChats)
  }, []);

  return (
    <div className="h-full w-full">
      {/* Mobile header */}
      <div className="md:hidden h-14 border-b border-border bg-bg-base/80 backdrop-blur-sm px-4 flex items-center gap-3 shrink-0">
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="w-10 h-10 -ml-1 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h14M3 10h14M3 15h14"/>
          </svg>
        </button>
        <span className="text-sm font-medium text-text-primary">Messages</span>
      </div>

      {/* Chat list */}
    </div>
  )
}
