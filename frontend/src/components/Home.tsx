import { useState, useEffect } from 'react'
import { chatApi } from '../api/client'
import { Sidebar } from './Sidebar'
import type { Chat } from '../types'

export function Home() {
  const [chats, setChats] = useState<Chat[]>([])

  useEffect(() => {
    chatApi.listChats().then(setChats)
  }, []);
 
  return (
    <div className="h-full w-full">
      <Sidebar
        chats={chats}
        selectedChatId={null}
        onSelect={() => {}}
        isNewChat={() => {}}
      />
    </div>
  )
}
