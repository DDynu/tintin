# People Tab & Unified Chat Implementation

## Overview

Remove the friendship system and replace it with a People tab that lets any user start a chat with any other user. A unified NewChatModal handles both direct messages and group chats.

## Architecture

### Backend Changes

**Remove:**
- `backend/app/friends/` — router, service
- `backend/app/models.py` Friendship model and its relationships on User
- `backend/app/schemas.py` FriendshipCreate, FriendshipOut
- `backend/app/main.py` friends_router import and include

**New endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users excluding current user |
| POST | `/chats/dm/{username}` | Create or return existing 1-on-1 DM chat |

**`POST /chats/dm/{username}` behavior:**
- Find user by username; return 404 if not found
- Search existing chats for one with exactly these two users; return it if found
- Otherwise create new Chat (type="dm") with both users as participants

**`GET /users` behavior:**
- Return list of all users excluding the authenticated user
- No pagination (small user base)
- Use TypeAdapter for ISO datetime serialization (matching existing pattern)

### Frontend Changes

**New:**
- `usersApi` in `api/client.ts` — `listUsers(): Promise<User[]>`
- `People.tsx` — component with search input and user list
- `createDm(username)` in `chatApi`

**Modified:**
- `NewChatModal.tsx` — two tabs: "Direct Message" (select user from list) and "Group" (name + comma-separated usernames)
- `Sidebar.tsx` — tab toggle (Chats / People), shows either chat list or people list
- `App.tsx` — `onStartDm` handler, passes to Sidebar and NewChatModal

**Data flow:**
1. Sidebar loads `GET /users` on mount, caches via react-query
2. Click user in People tab → open NewChatModal with DM tab pre-selected → select user → `POST /chats/dm/{username}` → returns Chat → navigate to `/chat/{id}`
3. Group chat: modal sends `POST /chats/` → returns Chat → navigate to `/chat/{id}`

## Error Handling

- User not found: inline error in modal
- Already have a DM: return existing chat (no error)
- Network error: inline error display (existing pattern)
