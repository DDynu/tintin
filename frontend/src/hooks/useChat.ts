import { useState, useEffect, useCallback, useRef } from 'react'
import { chatApi } from '../api/client'
import { WebSocketClient } from '../api/ws'
import type { Message } from '../types'

export function useChat(chatId: number | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [ws, setWs] = useState<WebSocketClient | null>(null)
  const prevChatId = useRef<number | null>(null)
  const seenIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !chatId) return

    const userId = parseInt(JSON.parse(atob(token.split('.')[1])).sub)
    const client = new WebSocketClient(
      userId,
      (msg) => {
        if (seenIds.current.has(msg.id)) return
        seenIds.current.add(msg.id)
        setMessages((prev) => [...prev, msg])
      },
      () => client.joinChat(chatId),
    )
    client.connect()
    setWs(client)
    return () => client.close()
  }, [chatId])

  useEffect(() => {
    if (chatId && chatId !== prevChatId.current) {
      chatApi.getMessages(chatId).then((data) => {
        const reversed = data.reverse()
        seenIds.current = new Set(reversed.map(m => m.id))
        setMessages(reversed)
      })
      prevChatId.current = chatId
    }
  }, [chatId])

  const sendMessage = useCallback(
    (content: string, id?: string) => {
      ws?.sendMessage(chatId!, content, id)
    },
    [ws, chatId],
  )

  return { messages, sendMessage }
}
