import { useState, useEffect, useCallback, useRef } from 'react'
import { chatApi } from '../api/client'
import { WebSocketClient, type ParticipantChangeHandler, type ChatDeletedHandler } from '../api/ws'
import { decodeJwtPayload } from '../utils/jwt'
import type { Message } from '../types'

export function useChat(chatId: number | null, onParticipantChange?: ParticipantChangeHandler, onChatDeleted?: ChatDeletedHandler) {
  const [messages, setMessages] = useState<Message[]>([])
  const wsClient = useRef<WebSocketClient | null>(null)
  const prevChatId = useRef<number | null>(null)
  const seenIds = useRef<Set<number>>(new Set())

  // The websocket client connection
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token || !chatId) return

    const payload = decodeJwtPayload(token)
    if (Object.keys(payload).length === 0 || !payload.sub) {
      console.error('[useChat] Failed to decode JWT payload, cannot determine user ID')
      return
    }
    const userId = parseInt(payload.sub)
    if (isNaN(userId) || userId <= 0) {
      console.error('[useChat] Invalid user ID from JWT payload:', payload.sub)
      return
    }
    const client = new WebSocketClient(
      userId,
      (msg) => {
        if (seenIds.current.has(msg.id)) return
        seenIds.current.add(msg.id)
        setMessages((prev) => [...prev, msg])
      },
      () => client.joinChat(chatId),
      onParticipantChange,
      onChatDeleted,
    )
    client.connect()
    wsClient.current = client
    return () => {
      client.close()
    }
  }, [chatId, onParticipantChange])

  // Get message when entering chat
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
    (content: string) => {
      wsClient.current?.sendMessage(chatId!, content)
    },
    [wsClient, chatId],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, sendMessage, clearMessages }
}
