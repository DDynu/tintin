#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Copy .env.example if .env doesn't exist
[ -f .env ] || cp .env.example .env

# Source the venv
source ./.venv/bin/activate

docker compose up -d

# Start uvicorn on port 8001
exec uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
