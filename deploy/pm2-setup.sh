#!/usr/bin/env bash
# ============================================================================
# ORA JEWELLERY — PM2 CLUSTER SETUP (Phase 4)
# ============================================================================
# Run as DEPLOY user after Phase 3 deployment.
#
# Tasks:
#   1. Create log directory
#   2. Copy ecosystem config
#   3. Start PM2 cluster
#   4. Save PM2 process list (survives reboot)
#   5. Validate cluster
#
# Usage:
#   bash ~/pm2-setup.sh
# ============================================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[PHASE 4]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

APP_DIR="/var/www/ora-backend"

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ORA Jewellery — PM2 Cluster Setup (Phase 4)     ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 1. CREATE LOG DIRECTORY
# ============================================================================
log "Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown deploy:deploy /var/log/pm2
log "✅ Log dir: /var/log/pm2"

# ============================================================================
# 2. COPY ECOSYSTEM CONFIG
# ============================================================================
log "Copying ecosystem config..."
cp $APP_DIR/deploy/ecosystem.config.js $APP_DIR/ecosystem.config.js
log "✅ ecosystem.config.js in place"

# ============================================================================
# 3. STOP ANY EXISTING PM2 PROCESSES
# ============================================================================
log "Stopping existing PM2 processes..."
pm2 delete all 2>/dev/null || true

# ============================================================================
# 4. START PM2 CLUSTER
# ============================================================================
log "Starting PM2 cluster (2 instances)..."
cd $APP_DIR
pm2 start ecosystem.config.js

# Wait for startup
sleep 5

# ============================================================================
# 5. VALIDATE CLUSTER
# ============================================================================
log "Validating cluster..."

# Check process count
INSTANCE_COUNT=$(pm2 jlist 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")

if [ "$INSTANCE_COUNT" -eq 2 ]; then
  log "✅ Cluster running with 2 instances"
else
  warn "Expected 2 instances, got $INSTANCE_COUNT"
fi

# Show PM2 status
pm2 status

# Test health endpoint
sleep 3
if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
  log "✅ Health check PASSED"
else
  warn "Health check failed — check pm2 logs"
  pm2 logs ora-backend --lines 20 --nostream
fi

# ============================================================================
# 6. SAVE PM2 STATE (PERSIST ACROSS REBOOTS)
# ============================================================================
log "Saving PM2 state..."
pm2 save

log "✅ PM2 will auto-restart on reboot"

# ============================================================================
# 7. LOG ROTATION SETUP
# ============================================================================
log "Setting up log rotation..."
pm2 install pm2-logrotate 2>/dev/null || warn "pm2-logrotate install failed — logs won't auto-rotate"
pm2 set pm2-logrotate:max_size 50M 2>/dev/null || true
pm2 set pm2-logrotate:retain 7 2>/dev/null || true
pm2 set pm2-logrotate:compress true 2>/dev/null || true

# ============================================================================
# DONE
# ============================================================================
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ PHASE 4 COMPLETE — PM2 Cluster Active        ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║                                                   ║"
echo "║  Cluster: 2 instances (cluster mode)              ║"
echo "║  Memory:  400MB per instance max                  ║"
echo "║  Logs:    /var/log/pm2/ora-backend-*.log           ║"
echo "║  Auto:    Restart on crash + reboot               ║"
echo "║                                                   ║"
echo "║  Commands:                                        ║"
echo "║  • pm2 status          — cluster overview         ║"
echo "║  • pm2 logs            — live logs                ║"
echo "║  • pm2 monit           — CPU/memory monitor       ║"
echo "║  • pm2 reload all      — zero-downtime reload     ║"
echo "║                                                   ║"
echo "║  NEXT: Phase 5 — Nginx + SSL                      ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
