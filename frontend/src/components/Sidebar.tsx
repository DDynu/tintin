import { useState } from 'react'
import { ChatView } from './ChatView'
import type { Chat } from '../types'

interface Props {
  chats: Chat[]
  selectedChatId: number | null
  onSelect: (id: number) => void
}

export function Sidebar({ chats, selectedChatId, onSelect }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-full bg-gray-950">
      <div
        className={`${
          mobileOpen ? 'w-full' : 'md:w-64'
        } border-r border-gray-800 flex flex-col flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-800 font-semibold text-gray-100">
          Chats
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No chats yet</p>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelect(chat.id)
                  setMobileOpen(false)
                }}
                className={`w-full text-left p-4 hover:bg-gray-900 border-b border-gray-800 ${
                  selectedChatId === chat.id ? 'bg-gray-900' : ''
                }`}
              >
                <div className="font-medium text-gray-100">
                  {chat.name || chat.type}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {chat.last_message || 'No messages'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      {selectedChatId && (
        <div className="flex-1 min-w-0">
          <ChatView chatId={selectedChatId} />
        </div>
      )}
    </div>
  )
}
