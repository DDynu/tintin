# People Tab & Unified Chat Creation

## Overview

Remove the friendship system and replace it with a "People" tab that lets any user start a chat with any other user. A unified "New Chat" modal handles both direct messages and group chats.

## Changes

### Remove: Friends Module
- `backend/app/friends/` — router, service, all endpoints
- `backend/app/models.py` Friendship model
- `backend/app/schemas.py` FriendshipCreate, FriendshipOut
- `backend/app/models.py` Friendship relationships on User
- Frontend friendship API (`friendsApi`) and types

### New Backend Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users (for People tab) |
| POST | `/chats/dm/{username}` | Create 1-on-1 chat with a user |

**`POST /chats/dm/{username}` behavior:**
- If a chat already exists between the two users, return the existing chat
- Otherwise create a new DM chat with both users as participants

### New Frontend Components

**`People.tsx`**
- People tab in Sidebar, lists all users
- Search input filters by username
- "Start Chat" button per user → calls `POST /chats/dm/{username}` → navigates to chat

**Refactored `NewChatModal`**
- Two tabs: "Direct Message" and "Group"
- DM tab: search/select from user list, auto-creates chat on selection
- Group tab: name + select participants (existing behavior)

### Sidebar Updates
- Add People tab toggle (icon)
- Shows chat list OR people list based on active tab

## Data Flow

1. Sidebar loads `GET /users` on mount, caches result
2. Click user → `POST /chats/dm/{username}` → returns Chat → navigate to `/chat/{id}`
3. Group chat: modal sends `POST /chats/` → returns Chat → navigate to `/chat/{id}`

## Error Handling

- User not found: inline error in modal
- Already have a chat: return existing chat (no error)
- Network error: toast notification
