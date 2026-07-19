import type { Message } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private user_id: number
  private onMessage: (msg: Message) => void
  private onConnect: () => void
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  constructor(user_id: number, onMessage: (msg: Message) => void, onConnect: () => void) {
    this.user_id = user_id
    this.onMessage = onMessage
    this.onConnect = onConnect
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
