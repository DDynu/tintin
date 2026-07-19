import type { Message } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws'

export type ChatDeletedHandler = (data: {
  type: 'chat_deleted'
  chat_id: number
}) => void

export type ParticipantChangeHandler = (data: {
  type: 'participant_added' | 'participant_removed'
  chat_id: number
  added_users?: { id: number; username: string; email: string; created_at: string }[]
  removed_user_id?: number
}) => void

export class WebSocketClient {
  private ws: WebSocket | null = null
  private user_id: number
  private onMessage: (msg: Message) => void
  private onConnect: () => void
  private onParticipantChange: ParticipantChangeHandler | null = null
  private onChatDeleted: ChatDeletedHandler | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(user_id: number, onMessage: (msg: Message) => void, onConnect: () => void, onParticipantChange?: ParticipantChangeHandler, onChatDeleted?: ChatDeletedHandler) {
    this.user_id = user_id
    this.onMessage = onMessage
    this.onConnect = onConnect
    this.onParticipantChange = onParticipantChange || null
    this.onChatDeleted = onChatDeleted || null
  }

  connect() {
    this.ws = new WebSocket(`${WS_URL}?user_id=${this.user_id}`)
    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.onConnect()
    }
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') this.onMessage(data.message)
        else if (data.type === 'participant_added' || data.type === 'participant_removed') {
          this.onParticipantChange?.(data)
        }
        else if (data.type === 'chat_deleted') {
          this.onChatDeleted?.({ type: 'chat_deleted', chat_id: data.chat_id })
        }
        else if (data.type === 'join_chat') {
          this.joinChat(data.chat_id)
        }
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err, 'raw:', e.data)
      }
    }
    this.ws.onerror = (err) => {
      console.error('[WebSocket] Connection error:', err)
    }
    this.ws.onclose = () => {
      console.warn('[WebSocket] Connection closed. Attempting reconnect...')
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached')
      return
    }
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000)
    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => {
      console.log(`[WebSocket] Reconnecting... attempt ${this.reconnectAttempts}`)
      this.connect()
    }, delay)
  }

  sendMessage(chatId: number, content: string) {
    this.ws?.send(JSON.stringify({ type: 'message', chat_id: chatId, content }))
  }

  joinChat(chatId: number) {
    this.ws?.send(JSON.stringify({ type: 'join', chat_id: chatId }))
  }

  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.ws?.close()
  }
}
