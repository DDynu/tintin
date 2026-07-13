#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "=== TinTin — Starting Development Environment ==="

# ── 1. Database (Docker) ──────────────────────────────────────────────────────
echo ""
echo "[1/5] Starting PostgreSQL..."
docker compose up -d

# # Wait for PostgreSQL to accept connections
# echo "Waiting for database to be ready..."
# DB_URL="postgresql+asyncpg://tintin:tintin@localhost:5432/tintin"
# for i in $(seq 1 30); do
#   if python -c "import asyncpg; asyncio.run(asyncpg.connect('$DB_URL'))" 2>/dev/null; then
#     echo "Database is ready."
#     break
#   fi
#   sleep 1
#   echo "  ... waiting ($i/30)"
# done

# ── 2. Backend venv + deps ────────────────────────────────────────────────────
echo ""
echo "[2/5] Setting up backend..."
cd "$ROOT_DIR/backend"

# Create venv if it doesn't exist
if [ ! -d .venv ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
fi
source .venv/bin/activate

# Copy .env if missing
[ -f .env ] || cp .env.example .env

# Install deps
pip install -q -e ".[test]" 2>/dev/null

# Initialize DB tables
echo "Initializing database tables..."
python init_db.py

# ── 3. Frontend deps ──────────────────────────────────────────────────────────
echo ""
echo "[3/5] Setting up frontend..."
cd "$ROOT_DIR/frontend"

if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

# ── 4. Fix vite proxy port mismatch ───────────────────────────────────────────
# Backend runs on 8001, vite config must match
VITE_CONFIG="$ROOT_DIR/frontend/vite.config.ts"
if grep -q 'localhost:8000' "$VITE_CONFIG"; then
  echo ""
  echo "[4/5] Fixing vite proxy port (8000 → 8001)..."
  sed -i 's|localhost:8000|localhost:8001|g' "$VITE_CONFIG"
fi

# ── 5. Start services ─────────────────────────────────────────────────────────
echo ""
echo "[5/5] Starting servers..."
echo ""
echo "  Backend:  http://localhost:8001 (uvicorn)"
echo "  Frontend: http://localhost:3000 (Vite)"
echo "  Database: localhost:5432 (PostgreSQL)"
echo ""

cd "$ROOT_DIR/backend"
source .venv/bin/activate

# Start backend in background
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Trap to clean up both processes
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  docker compose down 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Press Ctrl+C to stop all services."
wait
