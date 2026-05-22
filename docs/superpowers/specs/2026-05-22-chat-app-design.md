# TinTin — Private Messaging Chat App

## Overview

A simple private messaging web app with user accounts, friends system, and real-time chat. Supports direct messages and group chats with a responsive sidebar layout.

## Stack

- **Backend:** FastAPI + Python + WebSocket
- **Frontend:** React + Vite + Tailwind CSS
- **Database:** PostgreSQL
- **Auth:** JWT tokens
- **Real-time:** WebSocket for message delivery

## Components

### Backend

- **Auth service** — register/login with username + email, JWT token issuance
- **Friends service** — send/receive/accept friend requests, block users, online status
- **Chat service** — create/manage DMs and groups, manage participants
- **Message service** — store and deliver messages via WebSocket
- **WebSocket handler** — routes messages to chat participants, handles reconnection

### Frontend

- **Auth layer** — login/register screens, token management
- **Hooks layer** — chat state, WebSocket connection, message handling
- **UI components** — Sidebar, ChatView, MessageBubble, GroupCreator

## Data Model

- **User** — id, username, email, password_hash, created_at
- **Friendship** — sender_id, receiver_id, status (pending/accepted/blocked), timestamps
- **Chat** — id, type (dm/group), participants, last_message
- **Message** — id, chat_id, sender_id, content, type (text/image/file), created_at
- **MessageRead** — message_id, reader_id, read_at

## Data Flow

1. User joins WebSocket on login, receives their messages
2. When sending a message, client broadcasts via WebSocket to the backend
3. Backend stores message in PostgreSQL, then broadcasts to all chat participants
4. Participants receive the message in real-time, client appends to their chat view
5. Read receipts are sent back via WebSocket when a message is viewed

## UI

- **Desktop:** Sidebar (conversations list) + main message area
- **Mobile:** Single view — list of chats, tap to open conversation, back button to return

## Error Handling

- Auth failures return 401, frontend redirects to login
- WebSocket disconnects trigger reconnect with exponential backoff
- Network errors during message send queue locally and retry on reconnect
- Invalid group members or permission errors return clear error messages

## Testing

- **Backend:** pytest for API endpoints, WebSocket tests with httpx
- **Frontend:** Vitest for hooks/utilities, React Testing Library for components
- **Integration:** test WebSocket message delivery between two connected clients
