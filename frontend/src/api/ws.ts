import type { Message } from '../types'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws'

export class WebSocketClient {
  private ws: WebSocket | null = null
  private user_id: number
  private onMessage: (msg: Message) => void
  private onConnect: () => void

  constructor(user_id: number, onMessage: (msg: Message) => void, onConnect: () => void) {
    this.user_id = user_id
    this.onMessage = onMessage
    this.onConnect = onConnect
  }

  connect() {
    this.ws = new WebSocket(`${WS_URL}?user_id=${this.user_id}`)
    this.ws.onopen = () => this.onConnect()
    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'message') this.onMessage(data.message)
      } catch (err) {
        console.error('[WebSocket] Failed to parse message:', err, 'raw:', e.data)
      }
    }
  }

  sendMessage(chatId: number, content: string, id?: string) {
    this.ws?.send(JSON.stringify({ type: 'message', chat_id: chatId, content, id }))
  }

  joinChat(chatId: number) {
    this.ws?.send(JSON.stringify({ type: 'join', chat_id: chatId }))
  }

  close() {
    this.ws?.close()
  }
}
