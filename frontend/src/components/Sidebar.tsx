import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { NewChatModal } from './NewChatModal'
import type { Chat } from '../types'

interface Props {
  chats: Chat[]
  selectedChatId: number | null
  onSelect: (id: number) => void
  isNewChat?: () => void
}

export function Sidebar({ chats, selectedChatId, onSelect, isNewChat }: Props) {
  const [showNewChat, setShowNewChat] = useState(false)
  const { logout, currentUser } = useAuth()
  const user = currentUser.data

  return (
    <>
      <div className="w-72 h-full bg-bg-base border-r border-border flex flex-col shrink-0
        fixed top-0 left-0 bottom-0 z-50 -translate-x-full md:relative md:translate-x-0
        transition-transform duration-200 ease-out">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-semibold tracking-widest text-text-dim uppercase">Messages</span>
            <button
              onClick={() => isNewChat?.() || setShowNewChat(true)}
              className="w-7 h-7 rounded-md bg-bg-hover text-amber text-sm font-medium hover:bg-bg-card transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber to-amber-dim flex items-center justify-center text-bg-base font-bold text-sm">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{user.username}</div>
                <div className="text-xs text-text-dim">Online</div>
              </div>
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-dim gap-2 px-6">
              <div className="text-xs uppercase tracking-widest">No conversations yet</div>
              <button
                onClick={() => setShowNewChat(true)}
                className="text-amber text-sm hover:underline"
              >
                Start one
              </button>
            </div>
          ) : (
            <div className="py-1">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  onClick={() => onSelect(chat.id)}
                  className={`group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-150 ${
                    selectedChatId === chat.id
                      ? 'bg-bg-card border border-border'
                      : 'hover:bg-bg-hover/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-secondary font-medium shrink-0">
                    {chat.name ? chat.name[0].toUpperCase() : '#'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate ${
                        selectedChatId === chat.id ? 'text-text-primary font-medium' : 'text-text-secondary'
                      }`}>
                        {chat.name || chat.type}
                      </span>
                      {chat.last_message && (
                        <span className="text-xs text-text-dim ml-2 shrink-0">
                          {new Date(chat.last_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-dim truncate mt-0.5">
                      {chat.last_message || `Type: ${chat.type}`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={logout}
            className="w-full text-xs text-text-dim hover:text-text-secondary transition-colors text-center py-1"
          >
            Sign Out
          </button>
        </div>
      </div>
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={() => {}}
          refresh={() => {}}
        />
      )}
    </>
  )
}
