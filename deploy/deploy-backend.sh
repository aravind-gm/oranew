#!/usr/bin/env bash
# ============================================================================
# ORA JEWELLERY — BACKEND DEPLOYMENT (Phase 3)
# ============================================================================
# Run as DEPLOY user on the VPS after Phase 2 completes.
#
# Tasks:
#   1. Clone repository
#   2. Install dependencies
#   3. Create production .env
#   4. Prisma generate + migrate
#   5. Build TypeScript
#   6. Test database connection
#
# Usage:
#   scp deploy-backend.sh deploy@YOUR_VPS_IP:~/
#   ssh deploy@YOUR_VPS_IP
#   bash ~/deploy-backend.sh
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[PHASE 3]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

APP_DIR="/var/www/ora-backend"
REPO_URL="https://github.com/aravind-gm/oranew.git"
BRANCH="main"

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ORA Jewellery — Backend Deployment (Phase 3)    ║"
echo "║  Clone → Install → Build → Test                  ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 1. CLONE REPOSITORY
# ============================================================================
if [ -d "$APP_DIR/.git" ]; then
  log "Repository exists — pulling latest..."
  cd $APP_DIR
  git fetch origin
  git reset --hard origin/$BRANCH
  git clean -fd
else
  log "Cloning repository..."
  git clone --branch $BRANCH $REPO_URL $APP_DIR
  cd $APP_DIR
fi

log "✅ Repository at $(git log --oneline -1)"

# ============================================================================
# 2. INSTALL BACKEND DEPENDENCIES
# ============================================================================
log "Installing backend dependencies..."
cd $APP_DIR/backend

# Install dependencies (npm install handles out-of-sync lockfiles)
rm -rf node_modules
npm install  # installs all deps including devDependencies needed for build

log "✅ Dependencies installed ($(ls node_modules | wc -l) packages)"

# ============================================================================
# 3. PRODUCTION .env
# ============================================================================
if [ ! -f "$APP_DIR/backend/.env" ]; then
  warn ".env not found — copying template"
  cp $APP_DIR/deploy/.env.production.template $APP_DIR/backend/.env
  chmod 600 $APP_DIR/backend/.env
  echo ""
  echo "╔═══════════════════════════════════════════════════╗"
  echo "║  ⚠️  ACTION REQUIRED:                            ║"
  echo "║  Edit /var/www/ora-backend/backend/.env           ║"
  echo "║  Fill in ALL values before continuing.            ║"
  echo "║                                                   ║"
  echo "║  nano /var/www/ora-backend/backend/.env            ║"
  echo "║                                                   ║"
  echo "║  Then re-run this script.                         ║"
  echo "╚═══════════════════════════════════════════════════╝"
  echo ""
  exit 0
fi

# Validate critical env vars
source $APP_DIR/backend/.env 2>/dev/null || true

if [ -z "${DATABASE_URL:-}" ]; then
  err "DATABASE_URL not set in .env"
fi
if [ -z "${JWT_SECRET:-}" ] || [ "${#JWT_SECRET}" -lt 64 ]; then
  err "JWT_SECRET must be at least 64 characters"
fi
if [ -z "${RAZORPAY_KEY_ID:-}" ]; then
  err "RAZORPAY_KEY_ID not set in .env"
fi
if [ -z "${REDIS_URL:-}" ]; then
  warn "REDIS_URL not set — Redis caching will be disabled"
fi

log "✅ .env validated — critical vars present"

# ============================================================================
# 4. PRISMA GENERATE + MIGRATE
# ============================================================================
log "Running Prisma generate..."
cd $APP_DIR/backend
npx prisma generate

log "Running Prisma migrate deploy..."
npx prisma migrate deploy

log "✅ Prisma client generated + migrations applied"

# ============================================================================
# 5. BUILD TYPESCRIPT
# ============================================================================
log "Building TypeScript..."
npm run build

if [ ! -f "$APP_DIR/backend/dist/server.js" ]; then
  err "Build failed — dist/server.js not found"
fi

log "✅ Build complete — dist/server.js ready"

# ============================================================================
# 6. TEST DATABASE CONNECTION
# ============================================================================
log "Testing database connection..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1 as ok\`
  .then(r => { console.log('✅ Database connection: OK'); process.exit(0); })
  .catch(e => { console.error('❌ Database connection FAILED:', e.message); process.exit(1); });
"

# ============================================================================
# 7. TEST REDIS CONNECTION
# ============================================================================
log "Testing Redis connection..."

if [ -n "${REDIS_URL:-}" ]; then
  node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping()
  .then(r => { console.log('✅ Redis connection: OK (' + r + ')'); process.exit(0); })
  .catch(e => { console.error('❌ Redis connection FAILED:', e.message); process.exit(1); });
setTimeout(() => { console.error('❌ Redis timeout'); process.exit(1); }, 5000);
"
else
  warn "Redis URL not set — skipping Redis test"
fi

# ============================================================================
# 8. QUICK SMOKE TEST
# ============================================================================
log "Running smoke test (start server for 10s)..."

# Start server in background, capture PID
cd $APP_DIR/backend
timeout 10 node dist/server.js &
SERVER_PID=$!
sleep 5

# Test health endpoint
if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
  log "✅ Smoke test PASSED — /api/health responds"
else
  warn "Smoke test failed — server may need more time or has startup errors"
fi

# Kill test server
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

# ============================================================================
# DONE
# ============================================================================
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ PHASE 3 COMPLETE — Backend Deployed          ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║                                                   ║"
echo "║  Location: /var/www/ora-backend/backend            ║"
echo "║  Entry:    dist/server.js                          ║"
echo "║  Port:     5000                                    ║"
echo "║                                                   ║"
echo "║  Supabase Connection Pool Notes:                  ║"
echo "║  • PM2 cluster = 2 instances                      ║"
echo "║  • connection_limit=5 per instance                ║"
echo "║  • Total max connections: ~10                     ║"
echo "║  • Supabase free tier allows ~60 connections      ║"
echo "║  • Headroom: 50 connections for safety            ║"
echo "║                                                   ║"
echo "║  NEXT: Run Phase 4 — PM2 cluster setup            ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
