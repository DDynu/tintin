import { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { useParams } from 'react-router-dom'
import { useApp } from '../App'

export function ChatView() {
  const { id } = useParams<{ id: string }>()
  const chatId = id ? parseInt(id) : 0
  const { showSidebar, setShowSidebar } = useApp()
  const { messages, sendMessage } = useChat(chatId)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
          #{chatId}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate">Chat #{chatId}</div>
          <div className="text-xs text-text-dim">1 member</div>
        </div>
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
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                sender={msg.sender.username}
                time={new Date(msg.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
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
    </div>
  )
}
