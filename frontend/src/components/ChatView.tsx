import { useState, useRef, useEffect, useCallback } from 'react'
import { useChat } from '../hooks/useChat'
import { chatApi } from '../api/client'
import { decodeJwtPayload } from '../utils/jwt'
import { MessageBubble } from './MessageBubble'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../App'
import { DateSeparator } from './DateSeparator'
import type { Chat, Message } from '../types'

interface ChatViewProps {
  refreshChats?: () => void
}

interface DateGroup {
  date: Date
  messages: Message[]
}

function groupMessagesByDate(messages: Message[]): DateGroup[] {
  const groups: DateGroup[] = []
  let currentDate: Date | null = null
  let currentGroup: Message[] = []

  for (const msg of messages) {
    const msgDate = new Date(msg.created_at)
    // Normalize to date-only comparison (ignore time)
    const dateKey = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`
    const currentKey = currentDate ? `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}` : ''

    if (dateKey !== currentKey) {
      if (currentGroup.length > 0) {
        groups.push({ date: currentDate!, messages: currentGroup })
      }
      currentDate = msgDate
      currentGroup = [msg]
    } else {
      currentGroup.push(msg)
    }
  }

  if (currentGroup.length > 0) {
    groups.push({ date: currentDate!, messages: currentGroup })
  }

  return groups
}

export function ChatView({ refreshChats }: ChatViewProps) {
  const { id } = useParams<{ id: string }>()
  const chatId = id ? parseInt(id) : null
  const { showSidebar, setShowSidebar } = useApp()
  const { messages, sendMessage } = useChat(chatId)
  const [input, setInput] = useState('')
  const [chat, setChat] = useState<Chat | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [newParticipant, setNewParticipant] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadChat = useCallback(() => {
    if (!chatId) return
    chatApi.listChats().then(chats => {
      const found = chats.find(c => c.id === chatId)
      if (found) {
        setChat(found)
        setEditName(found.name || '')
      }
    })
  }, [chatId])

  useEffect(() => {
    loadChat()
  }, [loadChat])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  const handleUpdateName = async () => {
    if (!chatId || !editName.trim()) return
    try {
      const updated = await chatApi.updateChatName(chatId, editName.trim())
      setChat(updated)
      setShowEdit(false)
    } catch (err) {
      console.error('Failed to update name:', err)
    }
  }

  const handleAddParticipant = async () => {
    if (!chatId || !newParticipant.trim()) return
    try {
      const updated = await chatApi.addParticipants(chatId, [newParticipant.trim()])
      setChat(updated)
      setNewParticipant('')
    } catch (err) {
      console.error('Failed to add participant:', err)
    }
  }

  const handleRemoveParticipant = async (userId: number) => {
    if (!chatId) return
    try {
      const updated = await chatApi.removeParticipant(chatId, userId)
      setChat(updated)
    } catch (err) {
      console.error('Failed to remove participant:', err)
    }
  }

  const currentUserId = parseInt(decodeJwtPayload(localStorage.getItem('token') || '').sub || '0') || 0
  const isOwner = chat?.owner_id === currentUserId

  const navigate = useNavigate()

  const handleDelete = async () => {
    if (!chatId) return
    try {
      await chatApi.deleteChat(chatId)
      refreshChats?.()
      navigate('/')
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }

  const handleOpenEdit = () => {
    if (chat) {
      setEditName(chat.name || '')
      setShowEdit(true)
    }
  }

  return (
    <div className="flex flex-col h-full bg-bg-deep
      fixed top-0 right-0 left-0 bottom-0 z-10
      md:static md:z-0">
      {/* Header */}
      <div className="h-14 border-b border-border bg-bg-base/80 backdrop-blur-sm px-4 md:px-5 flex items-center gap-3 shrink-0">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="md:hidden w-10 h-10 -ml-1 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 5h14M3 10h14M3 15h14"/>
          </svg>
        </button>

        <div className="w-8 h-8 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-secondary font-medium">
          {chat?.name ? chat.name[0].toUpperCase() : chat?.type === 'dm' ? '#' : 'G'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">
            {chat?.name || chat?.type === 'dm' ? 'Direct Message' : chat?.name || `Group Chat #${chatId}`}
          </div>
          <div className="text-xs text-text-dim">
            {chat?.type === 'dm' ? 'Direct Message' : `${chat?.participants?.length || 0} members`}
          </div>
        </div>
        
        {/* Edit & Delete buttons (only for group chats or if user is owner) */}
        {isOwner && (
          <>
            {chat?.type !== 'dm' && (
              <button
                onClick={handleOpenEdit}
                className="w-8 h-8 rounded-md bg-bg-hover text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                title="Edit chat"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 2h3v3l-9 9H2v-3l9-9z"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(`Delete "${chat?.name || chat?.type}"? This cannot be undone.`)) {
                  handleDelete()
                }
              }}
              className="w-8 h-8 rounded-md bg-red-900/40 text-red-400 hover:bg-red-900/70 hover:text-red-200 transition-colors flex items-center justify-center"
              title="Delete chat"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 5h12M6 5V3h4v2M5 5v7a1 1 0 001 1h4a1 1 0 001-1V5"/>
                <path d="M6 7v4M10 7v4"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-dim gap-2">
            <div className="text-xs uppercase tracking-widest">No messages yet</div>
            <div className="text-xs">Send the first message to start the conversation</div>
          </div>
        ) : (
          <div className="space-y-3">
            {groupMessagesByDate(messages).map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <DateSeparator date={group.date} />
                {group.messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    content={msg.content}
                    sender={msg.sender?.username ?? 'Unknown'}
                    time={new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="px-4 md:px-5 py-3 md:py-4 border-t border-border bg-bg-base/50 shrink-0"
      >
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-bg-surface text-text-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40 placeholder-text-dim transition-colors"
            placeholder="Type a message..."
          />
          <button
            type="submit"
            className="px-5 py-3 bg-amber text-bg-base text-sm font-medium rounded-xl hover:bg-amber-glow transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </form>

      {/* Edit Modal */}
      {showEdit && chat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-primary">Edit Chat</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Chat Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {chat.type === 'dm' ? 'Contact Name' : 'Group Name'}
                </label>
                <div className="flex gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-bg-surface text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
                    placeholder={chat.type === 'dm' ? 'Contact name' : 'Group name'}
                  />
                  <button
                    onClick={handleUpdateName}
                    className="px-4 py-2 bg-amber text-bg-base text-sm font-medium rounded-lg hover:bg-amber-glow transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Participants (only for group chats) */}
              {chat.type !== 'dm' && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Members ({chat.participants?.length || 0})
                  </label>
                  <div className="space-y-2 mb-3">
                    {chat.participants?.map((participant) => (
                      <div key={participant.id} className="flex items-center justify-between bg-bg-surface rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber to-amber-dim flex items-center justify-center text-bg-base text-xs font-bold">
                            {participant.username[0].toUpperCase()}
                          </div>
                          <span className="text-sm text-text-primary">{participant.username}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveParticipant(participant.id)}
                          className="text-text-dim hover:text-red-400 transition-colors"
                          title="Remove member"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M3 7h8M7 3v8"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      value={newParticipant}
                      onChange={(e) => setNewParticipant(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                      className="flex-1 bg-bg-surface text-text-primary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber/40"
                      placeholder="Add by username"
                    />
                    <button
                      onClick={handleAddParticipant}
                      className="px-4 py-2 bg-amber text-bg-base text-sm font-medium rounded-lg hover:bg-amber-glow transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-5 py-4 border-t border-border">
              <button
                onClick={() => setShowEdit(false)}
                className="w-full py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
