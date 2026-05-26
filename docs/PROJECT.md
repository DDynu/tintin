# TinTin — Real-time Chat Application

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| State | TanStack Query, React Router v7, Context API |
| Real-time | Socket.io-client |
| HTTP | Axios |
| Backend | FastAPI, Python 3.11+ |
| Database | PostgreSQL 16 (async via asyncpg + SQLAlchemy) |
| Auth | JWT (python-jose), password hashing (bcrypt) |

## Project Structure

```
TinTin/
├── docker-compose.yml          # PostgreSQL 16 container
├── .gitignore
├── frontend/
│   ├── package.json            # React 19 + TypeScript + Vite + Tailwind
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx            # App entry point
│       ├── App.tsx             # Router, AuthGuard, MainLayout
│       ├── index.css           # Tailwind + custom theme
│       ├── api/
│       │   ├── client.ts       # Axios HTTP client
│       │   └── ws.ts           # Socket.io client
│       ├── hooks/
│       │   ├── useAuth.ts      # Auth state (login, register, logout)
│       │   └── useChat.ts      # Chat messages, send message
│       ├── components/
│       │   ├── Home.tsx          # Chat list view (mobile header + chat list)
│       │   ├── ChatView.tsx      # Chat room with messages + input
│       │   ├── Sidebar.tsx       # Chat list sidebar (drawer on mobile)
│       │   ├── Login.tsx         # Login form
│       │   ├── Register.tsx      # Registration form
│       │   ├── MessageBubble.tsx # Single message display
│       │   └── NewChatModal.tsx  # Create new chat dialog
│       ├── types/
│       │   └── index.ts        # TypeScript types
│       └── vite-env.d.ts
├── backend/
│   ├── pyproject.toml          # FastAPI, SQLAlchemy, Pydantic, etc.
│   ├── init_db.py              # Database initialization
│   ├── start.sh                # Startup script
│   ├── .env / .env.example     # Config (DB, JWT secrets)
│   └── app/
│       ├── main.py             # FastAPI app, CORS, router registration
│       ├── config.py           # Settings (env vars)
│       ├── database.py         # Async SQLAlchemy engine/session
│       ├── models.py           # SQLAlchemy ORM models
│       ├── schemas.py          # Pydantic request/response schemas
│       ├── auth/
│       │   ├── router.py       # Login/register endpoints
│       │   └── service.py      # JWT auth logic
│       ├── chats/
│       │   ├── router.py       # Chat CRUD endpoints
│       │   ├── service.py      # Chat business logic
│       │   └── websocket.py    # WebSocket endpoint (/ws)
│       ├── friends/
│       │   ├── router.py       # Friend endpoints
│       │   └── service.py      # Friend logic
│       └── tests/
│           └── test_auth.py    # Auth tests
├── docs/
└── plans/
```

## Key Files

- `frontend/src/App.tsx` — Router setup, auth guard, MainLayout with sidebar drawer
- `backend/app/main.py` — FastAPI entry, CORS, WebSocket route
- `backend/app/models.py` — SQLAlchemy models (User, Chat, Message, Friend)
- `backend/app/config.py` — Settings from environment variables
- `docker-compose.yml` — PostgreSQL container

## Running

1. **Database:** `docker compose up -d` (PostgreSQL on :5432)
2. **Backend:** `cd backend && python -m uvicorn app.main:app --reload`
3. **Frontend:** `cd frontend && npm run dev`

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/chats` | List user's chats |
| POST | `/chats` | Create chat |
| WS | `/ws?user_id=N` | WebSocket connection |

## Auth Flow

1. User registers/logs in → receives JWT
2. JWT stored in localStorage
3. AuthGuard in MainLayout checks token on route entry
4. WebSocket connection requires `user_id` query param
