# TinTin

A real-time chat application built with React, FastAPI, and PostgreSQL.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

- **Real-time messaging** via WebSocket (Socket.io)
- **User authentication** with JWT tokens
- **Chat management** — create and manage multiple conversations
- **Friend system** — connect with other users
- **Responsive design** — works seamlessly on desktop and mobile
- **Modern tech stack** — React 19, TypeScript, FastAPI, PostgreSQL

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| State | TanStack Query, React Router v7, Context API |
| Real-time | Socket.io-client |
| HTTP | Axios |
| Backend | FastAPI, Python 3.11+ |
| Database | PostgreSQL 16 (async via asyncpg + SQLAlchemy) |
| Auth | JWT (python-jose), password hashing (bcrypt) |

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Python 3.11+
- Node.js 18+

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/DDynu/tintin.git
   cd tintin
   ```

2. **Start the database**

   ```bash
   docker compose up -d
   ```

3. **Set up the backend**

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -e .
   cp .env.example .env
   python init_db.py
   python -m uvicorn app.main:app --reload
   ```

4. **Set up the frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:5173` to use the application.

## 📁 Project Structure

```
TinTin/
├── docker-compose.yml
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/    # React components
│       ├── hooks/         # Custom React hooks
│       ├── api/           # HTTP and WebSocket clients
│       └── types/         # TypeScript type definitions
├── backend/
│   ├── pyproject.toml
│   └── app/
│       ├── main.py        # FastAPI entry point
│       ├── auth/          # Authentication logic
│       ├── chats/         # Chat and WebSocket endpoints
│       └── friends/       # Friend system endpoints
├── docs/
└── plans/
```

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/chats` | List user's chats |
| POST | `/chats` | Create a new chat |
| WS | `/ws?user_id=N` | WebSocket connection for real-time messaging |

## 🔐 Authentication Flow

1. User registers or logs in → receives JWT token
2. JWT stored in `localStorage`
3. `AuthGuard` in `MainLayout` checks token on route entry
4. WebSocket connection requires `user_id` query parameter

## 🧪 Development

### Running Tests

```bash
cd backend
python -m pytest
```

### Environment Variables

Backend configuration is managed through `.env` file. See `.env.example` for available options.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [DDynu](https://github.com/DDynu)
