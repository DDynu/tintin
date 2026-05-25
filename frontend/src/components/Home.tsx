import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { chatApi } from '../api/client'
import { Sidebar } from './Sidebar'
import { NewChatModal } from './NewChatModal'
import type { Chat } from '../types'

interface Props {
  onSelect?: (id: number) => void
}

export function Home({ onSelect }: Props) {
  const { currentUser } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [showNewChat, setShowNewChat] = useState(false)

  useEffect(() => {
    chatApi.listChats().then(setChats)
  }, [])

  useEffect(() => {
    currentUser.data && chatApi.listChats().then(setChats)
  }, [currentUser.data])

  return (
    <div className="h-full w-full">
      <Sidebar
        chats={chats}
        selectedChatId={null}
        onSelect={onSelect ?? (() => {})}
        isNewChat={() => setShowNewChat(true)}
      />
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onCreated={() => {}}
          refresh={() => chatApi.listChats().then(setChats)}
        />
      )}
    </div>
  )
}
