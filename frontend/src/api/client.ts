import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type {
  AuthResponse,
  ChatCreateRequest,
  Chat,
  Friendship,
  FriendshipCreateRequest,
  MessageCreateRequest,
  MessageWithChat,
  Message,
  User,
  LoginRequest,
  RegisterRequest,
} from '../types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
  })

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    },
  )

  return instance
}

const client = createClient()

export const authApi = {
  register(data: RegisterRequest): Promise<AuthResponse> {
    return client.post('/auth/register', data).then(res => res.data)
  },

  login(data: LoginRequest): Promise<AuthResponse> {
    return client.post('/auth/login', data).then(res => res.data)
  },

  me(): Promise<User> {
    return client.get('/auth/me').then(res => res.data)
  },
}

export const chatApi = {
  createChat(data: ChatCreateRequest): Promise<Chat> {
    return client.post('/chats/', data).then(res => res.data)
  },

  listChats(): Promise<Chat[]> {
    return client.get('/chats/').then(res => res.data)
  },

  getMessages(chatId: number): Promise<MessageWithChat[]> {
    return client.get(`/chats/${chatId}/messages`).then(res => res.data)
  },

  postMessage(chatId: number, data: MessageCreateRequest): Promise<Message> {
    return client.post(`/chats/${chatId}/messages`, data).then(res => res.data)
  },
}

export const friendsApi = {
  sendRequest(data: FriendshipCreateRequest): Promise<Friendship> {
    return client.post('/friends/request', data).then(res => res.data)
  },

  acceptRequest(requestId: number): Promise<{ status: string }> {
    return client.post(`/friends/request/${requestId}/accept`).then(res => res.data)
  },

  listFriendships(): Promise<Friendship[]> {
    return client.get('/friends/').then(res => res.data)
  },

  getPending(): Promise<Friendship[]> {
    return client.get('/friends/pending').then(res => res.data)
  },
}

export default client
