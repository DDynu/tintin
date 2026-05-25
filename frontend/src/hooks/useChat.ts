import { useState, useEffect, useCallback, useRef } from 'react'
import { chatApi } from '../api/client'
import { WebSocketClient } from '../api/ws'
import type { Message } from '../types'

export function useChat(chatId: number | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [ws, setWs] = useState<WebSocketClient | null>(null)
  const prevChatId = useRef<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !chatId) return

    const userId = parseInt(JSON.parse(atob(token.split('.')[1])).sub)
    const client = new WebSocketClient(
      userId,
      (msg) => setMessages((prev) => prev.findIndex((m) => m.id === msg.id) !== -1 ? prev : [...prev, msg]),
      () => client.joinChat(chatId),
    )
    client.connect()
    setWs(client)
    return () => client.close()
  }, [chatId])

  useEffect(() => {
    if (chatId && chatId !== prevChatId.current) {
      chatApi.getMessages(chatId).then((data) => setMessages(data.reverse()))
      prevChatId.current = chatId
    }
  }, [chatId])

  const sendMessage = useCallback(
    (content: string) => {
      ws?.sendMessage(chatId!, content)
    },
    [ws, chatId],
  )

  return { messages, sendMessage }
}
