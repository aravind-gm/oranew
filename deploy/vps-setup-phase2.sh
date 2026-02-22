#!/usr/bin/env bash
# ============================================================================
# ORA JEWELLERY — CORE STACK INSTALLATION (Phase 2)
# ============================================================================
# Run as DEPLOY user (with sudo) on the hardened VPS
#
# Installs:
#   1. Node.js 20 LTS (via NodeSource)
#   2. PM2 (global)
#   3. Nginx
#   4. Redis (local-only, bind 127.0.0.1)
#   5. Git + build tools
#
# Usage:
#   scp vps-setup-phase2.sh deploy@YOUR_VPS_IP:~/
#   ssh deploy@YOUR_VPS_IP
#   chmod +x ~/vps-setup-phase2.sh
#   bash ~/vps-setup-phase2.sh
# ============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[PHASE 2]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ORA Jewellery — Core Stack Install (Phase 2)    ║"
echo "║  Node 20 + PM2 + Nginx + Redis + Git             ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# 1. BUILD ESSENTIALS + GIT
# ============================================================================
log "Installing build essentials and Git..."
sudo apt-get update -y
sudo apt-get install -y \
  build-essential \
  git \
  curl \
  wget \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common \
  htop \
  tree \
  jq

log "✅ Build tools + Git installed"
git --version

# ============================================================================
# 2. NODE.JS 20 LTS
# ============================================================================
log "Installing Node.js 20 LTS..."

# NodeSource setup
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
log "✅ Node.js $(node --version) installed"

# ============================================================================
# 3. PM2 (Global)
# ============================================================================
log "Installing PM2 globally..."
sudo npm install -g pm2

# Setup PM2 startup (auto-start on reboot)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
log "✅ PM2 $(pm2 --version) installed + startup configured"

# ============================================================================
# 4. NGINX
# ============================================================================
log "Installing Nginx..."
sudo apt-get install -y nginx

# Disable default site
sudo rm -f /etc/nginx/sites-enabled/default

# Start and enable
sudo systemctl enable nginx
sudo systemctl start nginx

log "✅ Nginx installed and running"
nginx -v

# ============================================================================
# 5. REDIS (LOCAL-ONLY)
# ============================================================================
log "Installing Redis..."
sudo apt-get install -y redis-server

# ── CRITICAL: Bind Redis to localhost ONLY ──
log "Configuring Redis for local-only access..."
REDIS_CONF="/etc/redis/redis.conf"
sudo cp $REDIS_CONF ${REDIS_CONF}.backup

# Ensure bind to 127.0.0.1 only
sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' $REDIS_CONF

# Enable protected mode
sudo sed -i 's/^# *protected-mode yes/protected-mode yes/' $REDIS_CONF
sudo sed -i 's/^protected-mode no/protected-mode yes/' $REDIS_CONF

# Set password for Redis
REDIS_PASSWORD=$(openssl rand -hex 16)
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  🔑 REDIS PASSWORD (save this):                  ║"
echo "║  $REDIS_PASSWORD  ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Set requirepass
if grep -q "^requirepass" $REDIS_CONF; then
  sudo sed -i "s/^requirepass .*/requirepass $REDIS_PASSWORD/" $REDIS_CONF
else
  echo "requirepass $REDIS_PASSWORD" | sudo tee -a $REDIS_CONF > /dev/null
fi

# Set maxmemory (256MB — sufficient for caching + BullMQ)
if grep -q "^maxmemory " $REDIS_CONF; then
  sudo sed -i 's/^maxmemory .*/maxmemory 256mb/' $REDIS_CONF
else
  echo "maxmemory 256mb" | sudo tee -a $REDIS_CONF > /dev/null
fi

# Eviction policy — LRU for cache, but BullMQ data should persist
if grep -q "^maxmemory-policy " $REDIS_CONF; then
  sudo sed -i 's/^maxmemory-policy .*/maxmemory-policy allkeys-lru/' $REDIS_CONF
else
  echo "maxmemory-policy allkeys-lru" | sudo tee -a $REDIS_CONF > /dev/null
fi

# Restart Redis with new config
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Verify Redis
if redis-cli -a "$REDIS_PASSWORD" ping | grep -q PONG; then
  log "✅ Redis installed, local-only, password-protected"
else
  err "Redis ping failed — check config"
fi

# Verify Redis is NOT accessible externally
log "Verifying Redis is not exposed externally..."
if ss -tlnp | grep -q '0.0.0.0:6379'; then
  err "SECURITY: Redis is bound to 0.0.0.0 — must be 127.0.0.1 only!"
else
  log "✅ Redis bound to localhost only (127.0.0.1)"
fi

# ============================================================================
# 6. CREATE APP DIRECTORY
# ============================================================================
log "Creating application directory..."
sudo mkdir -p /var/www/ora-backend
sudo chown deploy:deploy /var/www/ora-backend
log "✅ App directory: /var/www/ora-backend"

# ============================================================================
# 7. SAVE REDIS CREDENTIALS
# ============================================================================
# Save Redis password for Phase 3 .env setup
echo "REDIS_PASSWORD=$REDIS_PASSWORD" > /home/deploy/.redis-credentials
chmod 600 /home/deploy/.redis-credentials
log "✅ Redis credentials saved to ~/.redis-credentials"

# ============================================================================
# VERIFICATION SUMMARY
# ============================================================================
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  ✅ PHASE 2 COMPLETE — Core Stack Installed      ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║                                                   ║"
echo "║  Versions:                                        ║"
echo "║  • Node.js:  $(node --version | tr -d '\n')                            ║"
echo "║  • npm:      $(npm --version | tr -d '\n')                              ║"
echo "║  • PM2:      $(pm2 --version | tr -d '\n')                             ║"
echo "║  • Nginx:    $(nginx -v 2>&1 | cut -d/ -f2 | tr -d '\n')                            ║"
echo "║  • Redis:    $(redis-server --version | cut -d= -f2 | cut -d' ' -f1 | tr -d '\n')                            ║"
echo "║  • Git:      $(git --version | cut -d' ' -f3 | tr -d '\n')                           ║"
echo "║                                                   ║"
echo "║  Security:                                        ║"
echo "║  • Redis: 127.0.0.1 only, password-protected     ║"
echo "║  • PM2 startup: systemd registered                ║"
echo "║  • App dir: /var/www/ora-backend                  ║"
echo "║                                                   ║"
echo "║  NEXT:                                            ║"
echo "║  → Run Phase 3: Backend deployment                ║"
echo "║  → Use Redis password from ~/.redis-credentials   ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
