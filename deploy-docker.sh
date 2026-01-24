#!/usr/bin/env bash
set -e

echo "[1/5] Preparing environment..."
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Please update secrets (JWT, Razorpay, Postgres)."
  else
    echo "Warning: .env.example not found; create .env manually."
  fi
fi

# Ensure Docker is available
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Please install Docker and Docker Compose plugin first."
  echo "Docs: https://docs.docker.com/engine/install/ubuntu/"
  exit 1
fi

# Start services
echo "[2/5] Building and starting containers..."
docker compose up -d --build

# Wait briefly for backend to boot
echo "[3/5] Waiting for backend to become healthy..."
sleep 15

# Run database migrations
echo "[4/5] Applying Prisma migrations..."
if docker ps --format '{{.Names}}' | grep -q '^ora-backend$'; then
  docker exec ora-backend npx prisma migrate deploy || {
    echo "Prisma migrate deploy failed; attempting db push...";
    docker exec ora-backend npx prisma db push;
  }
else
  echo "Backend container 'ora-backend' not found; check docker compose output."
fi

# Show status
echo "[5/5] Services status:"
docker compose ps

echo "\nFrontend: http://localhost:3000"
echo "Backend:  http://localhost:5000"
echo "Health:   http://localhost:5000/health"
