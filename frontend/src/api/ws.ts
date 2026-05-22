import { io, Socket } from 'socket.io-client'
import type { Message } from '../types'

const WS_BASE = import.meta.env.VITE_WS_URL || 'http://localhost:8000'

export class WebSocketClient {
  private socket: Socket | null = null
  private connected = false
  private userId: number | null = null

  on(message: string, handler: (data: unknown) => void) {
    this.socket?.on(message, handler)
  }

  off(message: string, handler?: (data: unknown) => void) {
    this.socket?.off(message, handler)
  }

  connect(userId: number) {
    this.userId = userId
    this.socket = io(WS_BASE, {
      auth: { userId: String(userId) },
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      this.connected = true
    })

    this.socket.on('message', (msg: Message) => {
      this.socket?.emit('message_received', { messageId: msg.id, userId })
    })
  }

  close() {
    this.socket?.disconnect()
    this.socket = null
    this.connected = false
  }

  sendMessage(data: Message) {
    this.socket?.emit('message', data)
  }

  joinChat(chatId: number) {
    this.socket?.emit('join', { chatId })
  }

  leaveChat(chatId: number) {
    this.socket?.emit('leave', { chatId })
  }

  get isConnected() {
    return this.connected
  }
}

export const wsClient = new WebSocketClient()
