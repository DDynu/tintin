# People Tab & Unified Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the friendship system and replace it with a People tab that lets any user start a chat with any other user, plus a unified NewChatModal with DM and Group tabs.

**Architecture:** Remove `friends/` module entirely. Add `GET /users` and `POST /chats/dm/{username}` endpoints. Frontend adds People tab on Sidebar and refactors NewChatModal into two tabs.

**Tech Stack:** FastAPI (Python), React + TypeScript (frontend), SQLite, Tailwind CSS

---

## Task 1: Remove Friends Module (Backend)

**Files:**
- Delete: `backend/app/friends/router.py`
- Delete: `backend/app/friends/service.py`
- Modify: `backend/app/main.py:3-4` — remove friends_router import and include
- Modify: `backend/app/models.py:23-34` — remove Friendship model and its relationships on User
- Modify: `backend/app/schemas.py:28-36` — remove FriendshipCreate and FriendshipOut

- [ ] **Step 1: Delete friends module files**

```bash
rm backend/app/friends/router.py backend/app/friends/service.py
```

- [ ] **Step 2: Remove Friendship model and relationships from models.py**

Replace lines 23-34 (Friendship class) with nothing. Then update User class (lines 17-21) to remove `sent_friendships` and `received_friendships` relationships:

```python
class User(Base):
    __tablename__ = "users"
    # ...
    chats = relationship("Chat", back_populates="owner")
    messages = relationship("Message", back_populates="sender")
    read_receipts = relationship("MessageRead", back_populates="reader")
```

Remove lines 17-18 (sent_friendships, received_friendships).

- [ ] **Step 3: Remove Friendship types from schemas.py**

Delete lines 28-36 (FriendshipCreate and FriendshipOut classes).

- [ ] **Step 4: Remove friends_router from main.py**

Replace lines 3-4 and line 17:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.chats.router import router as chats_router
from app.chats.websocket import websocket_endpoint
from fastapi import WebSocket

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(chats_router)

@app.websocket("/ws")
async def ws(websocket: WebSocket, user_id: int):
    await websocket_endpoint(websocket, user_id)
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove friends module"
```

---

## Task 2: Add Users List Endpoint

**Files:**
- Modify: `backend/app/auth/service.py` — add `get_all_users` function
- Modify: `backend/app/auth/router.py` — add `/users` endpoint with TypeAdapter serialization

- [ ] **Step 1: Add get_all_users to auth/service.py**

Add after the existing functions:

```python
async def get_all_users(db: AsyncSession, exclude_user_id: int) -> list[User]:
    result = await db.execute(select(User).where(User.id != exclude_user_id).order_by(User.username))
    return result.scalars().all()
```

- [ ] **Step 2: Add GET /users endpoint to auth/router.py**

Add after existing endpoints (use TypeAdapter for ISO datetime serialization, matching existing pattern in chats router):

```python
from pydantic import TypeAdapter
from app.schemas import UserOut

@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    users = await get_all_users(db, user.id)
    return TypeAdapter(list[UserOut]).dump_python(users)
```

Note: `UserOut` schema already exists in `schemas.py` (lines 19-26) with `from_attributes = True`, matching the User ORM model shape.

- [ ] **Step 3: Commit**

```bash
git add backend/app/auth/service.py backend/app/auth/router.py
git commit -m "feat: add GET /users endpoint"
```

---

## Task 3: Add DM Chat Creation Endpoint

**Files:**
- Modify: `backend/app/chats/service.py` — add `create_dm_chat` function
- Modify: `backend/app/chats/router.py` — add `POST /chats/dm/{username}` endpoint

- [ ] **Step 1: Add create_dm_chat to chats/service.py**

First, add `get_user_by_username` to the import on line 1:

```python
from app.models import Chat, ChatParticipant, Message, MessageRead, User
from app.auth.service import get_user_by_username  # ADD THIS LINE
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
```

Then add before `get_user_chats`:

```python
async def create_dm_chat(db: AsyncSession, owner_id: int, other_username: str):
    # Find existing chat between these two users
    other_user = await get_user_by_username(db, other_username)
    if not other_user:
        return None

    # Check if a chat already exists between these two users
    result = await db.execute(
        select(Chat).join(ChatParticipant).where(ChatParticipant.user_id == owner_id)
    )
    existing_chats = result.scalars().all()
    for chat in existing_chats:
        participants_result = await db.execute(
            select(ChatParticipant).where(
                ChatParticipant.chat_id == chat.id
            )
        )
        participant_ids = {p.user_id for p in participants_result.scalars().all()}
        if other_user.id in participant_ids and len(participant_ids) == 2:
            return chat

    # Create new DM chat
    chat = Chat(type="dm", name=None, owner_id=owner_id)
    db.add(chat)
    await db.flush()

    participants = [
        ChatParticipant(chat_id=chat.id, user_id=owner_id),
        ChatParticipant(chat_id=chat.id, user_id=other_user.id),
    ]
    db.add_all(participants)
    await db.commit()
    await db.refresh(chat)
    return chat
```

- [ ] **Step 2: Add POST /chats/dm/{username} to chats/router.py**

Add after the existing endpoints:

```python
@router.post("/dm/{username}")
async def create_dm(username: str, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    chat = await create_dm_chat(db, user.id, username)
    if chat is None:
        raise HTTPException(status_code=404, detail="User not found")
    return TypeAdapter(ChatOut).dump_python(chat)
```

Add `from fastapi import HTTPException` to imports if not present.

- [ ] **Step 3: Commit**

```bash
git add backend/app/chats/service.py backend/app/chats/router.py
git commit -m "feat: add POST /chats/dm/{username} endpoint"
```

---

## Task 4: Add Users API to Frontend

**Files:**
- Modify: `frontend/src/api/client.ts` — add usersApi (uses existing `User` type)

- [ ] **Step 1: Add usersApi to api/client.ts**

Add after the authApi export (before chatApi):

```typescript
export const usersApi = {
  listUsers(): Promise<User[]> {
    return client.get('/users').then(res => res.data)
  },
}
```

Uses the existing `User` interface from `types/index.ts` (already has `id`, `username`, `email`, `created_at`).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/client.ts frontend/src/types/index.ts
git commit -m "feat: add usersApi to frontend"
```

---

## Task 5: Build People Tab Component

**Files:**
- Create: `frontend/src/components/People.tsx`

- [ ] **Step 1: Create People.tsx**

```typescript
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../api/client'
import type { User } from '../types'

interface Props {
  onStartChat: (username: string) => void
  currentUser: User
}

export function People({ onStartChat, currentUser }: Props) {
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
  })

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-bg-surface text-text-primary rounded-lg px-3.5 py-2.5 text-sm
          focus:outline-none focus:ring-1 focus:ring-border placeholder-text-dim mb-3"
        placeholder="Search users..."
      />
      {isLoading ? (
        <div className="text-xs text-text-dim text-center py-8">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-xs text-text-dim text-center py-8">No users found</div>
      ) : (
        <div className="space-y-1">
          {filtered.map(user => (
            <button
              key={user.id}
              onClick={() => onStartChat(user.username)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-hover/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber to-amber-dim flex items-center justify-center
                text-bg-base font-bold text-sm shrink-0">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text-primary truncate">{user.username}</div>
                <div className="text-xs text-text-dim truncate">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/People.tsx
git commit -m "feat: add People tab component"
```

---

## Task 6: Refactor NewChatModal to Two Tabs

**Files:**
- Modify: `frontend/src/components/NewChatModal.tsx`

- [ ] **Step 1: Rewrite NewChatModal.tsx**

Replace the entire file with:

```typescript
import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chatApi } from '../api/client'
import { usersApi } from '../api/client'
import type { Chat } from '../types'

interface Props {
  onClose: () => void
  onCreated: (chat: Chat) => void
}

export function NewChatModal({ onClose, onCreated }: Props) {
  const [tab, setTab] = useState<'dm' | 'group'>('dm')
  const [name, setName] = useState('')
  const [participants, setParticipants] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
  })

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (tab === 'dm') {
      if (!selectedUser) {
        setError('Select a user to start a chat')
        setLoading(false)
        return
      }
      try {
        const chat = await chatApi.createDm(selectedUser)
        onCreated(chat)
        onClose()
      } catch {
        setError('Failed to start chat')
      }
    } else {
      try {
        const chat = await chatApi.createChat({
          type: 'group',
          name: name || null,
          participantUsernames: participants.split(',').map(s => s.trim()).filter(Boolean),
        })
        onCreated(chat)
        onClose()
      } catch {
        setError('Failed to create chat')
      }
    }
    setLoading(false)
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 bg-bg-deep/60 backdrop-blur-sm flex items-center justify-center z-50 animate-overlay-fade"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-bg-base border border-border rounded-xl p-6 w-full max-w-sm animate-scale-in shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-text-primary">New Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim hover:text-text-secondary transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          {(['dm', 'group'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setSelectedUser(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-amber text-bg-base'
                  : 'bg-bg-surface text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {t === 'dm' ? 'Direct Message' : 'Group'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tab === 'group' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-surface text-text-primary rounded-lg px-3.5 py-2.5 text-sm
                focus:outline-none focus:ring-1 focus:ring-border placeholder-text-dim"
              placeholder="Chat name (optional)"
            />
          )}

          {tab === 'dm' ? (
            <div className="max-h-48 overflow-y-auto">
              {users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUser(user.username)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left ${
                    selectedUser === user.username
                      ? 'bg-bg-hover border border-border'
                      : 'hover:bg-bg-hover/50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber to-amber-dim flex items-center justify-center
                    text-bg-base font-bold text-xs shrink-0">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-text-primary truncate">{user.username}</span>
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full bg-bg-surface text-text-primary rounded-lg px-3.5 py-2.5 text-sm
                focus:outline-none focus:ring-1 focus:ring-border placeholder-text-dim"
              placeholder="Usernames (comma-separated)"
            />
          )}

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber text-bg-base text-sm font-medium rounded-lg
                hover:bg-amber-glow transition-colors disabled:opacity-30"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bg-surface text-text-secondary text-sm rounded-lg
                hover:bg-bg-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Add createDm to chatApi in api/client.ts**

Add to `chatApi`:

```typescript
createDm(username: string): Promise<Chat> {
  return client.post(`/chats/dm/${username}`).then(res => res.data)
},
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/NewChatModal.tsx frontend/src/api/client.ts
git commit -m "feat: refactor NewChatModal to DM and Group tabs"
```

---

## Task 7: Add People Tab to Sidebar

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx` — add People tab toggle and search

- [ ] **Step 1: Rewrite Sidebar.tsx**

```typescript
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../api/client'
import type { Chat } from '../types'

interface Props {
  chats: Chat[]
  selectedChatId: number | null
  onSelect: (id: number) => void
  isNewChat?: () => void
  onStartDm: (username: string) => void
}

export function Sidebar({ chats, selectedChatId, onSelect, isNewChat, onStartDm }: Props) {
  const { logout, currentUser } = useAuth()
  const user = currentUser.data
  const [tab, setTab] = useState<'chats' | 'people'>('chats')
  const [peopleSearch, setPeopleSearch] = useState('')

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.listUsers,
  })

  return (
    <>
      <div className="w-72 h-full bg-bg-base border-r border-border flex flex-col shrink-0
        md:relative md:z-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-semibold tracking-widest text-text-dim uppercase">Messages</span>
            <button
              onClick={() => isNewChat?.()}
              className="w-7 h-7 rounded-md bg-bg-hover text-amber text-sm font-medium hover:bg-bg-card transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber to-amber-dim flex items-center justify-center text-bg-base font-bold text-sm">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{user.username}</div>
                <div className="text-xs text-text-dim">Online</div>
              </div>
            </div>
          )}
        </div>

        {/* Tab toggle */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('chats')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'chats' ? 'text-amber border-b-2 border-amber' : 'text-text-dim'
            }`}
          >
            Chats
          </button>
          <button
            onClick={() => setTab('people')}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              tab === 'people' ? 'text-amber border-b-2 border-amber' : 'text-text-dim'
            }`}
          >
            People
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'chats' ? (
            chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-dim gap-2 px-6">
                <div className="text-xs uppercase tracking-widest">No conversations yet</div>
                <button
                  onClick={() => isNewChat?.()}
                  className="text-amber text-sm hover:underline"
                >
                  Start one
                </button>
              </div>
            ) : (
              <div className="py-1">
                {chats.map((chat) => (
                  <Link
                    key={chat.id}
                    to={`/chat/${chat.id}`}
                    onClick={() => onSelect(chat.id)}
                    className={`group flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all duration-150 ${
                      selectedChatId === chat.id
                        ? 'bg-bg-card border border-border'
                        : 'hover:bg-bg-hover/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center text-text-secondary font-medium shrink-0">
                      {chat.name ? chat.name[0].toUpperCase() : '#'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${
                          selectedChatId === chat.id ? 'text-text-primary font-medium' : 'text-text-secondary'
                        }`}>
                          {chat.name || chat.type}
                        </span>
                        {chat.last_message && (
                          <span className="text-xs text-text-dim ml-2 shrink-0">
                            {new Date(chat.last_message).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-dim truncate mt-0.5">
                        {chat.last_message || `Type: ${chat.type}`}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="p-3">
              {isLoading ? (
                <div className="text-xs text-text-dim text-center py-8">Loading...</div>
              ) : (
                <>
                  <input
                    type="text"
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    className="w-full bg-bg-surface text-text-primary rounded-lg px-3.5 py-2.5 text-sm
                      focus:outline-none focus:ring-1 focus:ring-border placeholder-text-dim mb-3"
                    placeholder="Search users..."
                  />
                  {people.filter(p => p.username.toLowerCase().includes(peopleSearch.toLowerCase())).length === 0 ? (
                    <div className="text-xs text-text-dim text-center py-8">No users found</div>
                  ) : (
                    <div className="space-y-1">
                      {people.filter(p => p.username.toLowerCase().includes(peopleSearch.toLowerCase())).map(person => (
                        <button
                          key={person.id}
                          onClick={() => onStartDm(person.username)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-hover/50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber to-amber-dim flex items-center justify-center
                            text-bg-base font-bold text-sm shrink-0">
                            {person.username[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-text-primary truncate">{person.username}</div>
                            <div className="text-xs text-text-dim truncate">{person.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={logout}
            className="w-full text-xs text-text-dim hover:text-text-secondary transition-colors text-center py-1"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Sidebar.tsx
git commit -m "feat: add People tab to Sidebar"
```

---

## Task 8: Wire Up People Tab in App.tsx

**Files:**
- Modify: `frontend/src/App.tsx` — add onStartDm handler, pass to Sidebar

- [ ] **Step 1: Update MainLayout in App.tsx**

Add `useNavigate` import and `onStartDm` handler:

```typescript
import { useState, createContext, useContext, type ReactNode, useEffect, useCallback, useRef } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
```

In MainLayout, add:

```typescript
const navigate = useNavigate()
const [showNewChat, setShowNewChat] = useState(false)
```

Add `onStartDm` handler:

```typescript
const handleStartDm = useCallback((username: string) => {
  setShowNewChat(true)
}, [])
```

Pass to Sidebar:

```typescript
<Sidebar
  chats={chats}
  selectedChatId={selectedChatId}
  onSelect={setSelectedChatId}
  isNewChat={() => setShowNewChat(true)}
  onStartDm={handleStartDm}
/>
```

Update NewChatModal:

```typescript
{showNewChat && (
  <NewChatModal
    onClose={() => setShowNewChat(false)}
    onCreated={(chat) => {
      refreshChats()
      navigate(`/chat/${chat.id}`)
    }}
  />
)}
```

Design note: `NewChatModal.onCreated` receives a `Chat` object. For both DMs and groups, the parent refreshes the chat list and navigates to the new chat.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire People tab DM flow in App.tsx"
```

---

## Task 9: Test and Fix

**Files:**
- Run: `npm run build` in frontend/
- Run: `python -m pytest` in backend/ (if tests exist)
- Manually test: login as two users, create DM from People tab, create group chat

- [ ] **Step 1: Build frontend**

```bash
cd frontend && npm run build
```

- [ ] **Step 2: Start backend and test**

```bash
cd backend && python -m uvicorn app.main:app --reload
```

- [ ] **Step 3: Test flows**

  1. Login as user A, go to People tab
  2. Click user B → NewChatModal opens with DM tab selected
  3. Select user B → chat created → navigates to chat view
  4. Send a message → verify it appears
  5. Create a group chat via NewChatModal → Group tab
  6. Verify group chat appears in sidebar

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: [describe any fixes]"
```
