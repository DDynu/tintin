export interface User {
  id: number
  username: string
  email: string
  created_at: string
}

export interface Message {
  id: number
  sender: User
  content: string
  created_at: string
}

export type ChatType = 'dm' | 'group'

export interface Chat {
  id: number
  type: ChatType
  name: string | null
  last_message: string | null
  created_at: string
}

export interface ChatWithParticipants extends Chat {
  participants: User[]
}

export interface MessageWithChat extends Message {
  chatId: number
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked'

export interface Friendship {
  id: number
  sender: User
  receiver: User
  status: FriendshipStatus
  created_at: string
}

export interface ChatParticipant {
  chatId: number
  userId: number
}

export interface FriendshipCreateRequest {
  targetUsername: string
}

export interface ChatCreateRequest {
  type: ChatType
  name: string | null
  participantUsernames: string[]
}

export interface MessageCreateRequest {
  content: string
}
