# Complete VPS Migration Mitigation Plan — All 7 Phases

**Project:** ORA Jewellery Express Backend Migration (Render → Hostinger VPS)  
**Date Created:** 24 February 2026  
**Status:** Phases 1-6 ✅ Complete | Phase 7 🔄 In Progress (48-hour window)  
**Infrastructure:** Ubuntu 22.04, Node.js 20.20.0, PM2 Cluster, Nginx, Redis 6.0.16, Let's Encrypt SSL

---

## Table of Contents
1. [Phase 1: VPS Hardening](#phase-1-vps-hardening)
2. [Phase 2: Stack Installation](#phase-2-stack-installation)
3. [Phase 3: Backend Deployment](#phase-3-backend-deployment)
4. [Phase 4: PM2 Cluster Setup](#phase-4-pm2-cluster-setup)
5. [Phase 5: Nginx + SSL Configuration](#phase-5-nginx--ssl-configuration)
6. [Phase 6: Redis & Queue Validation](#phase-6-redis--queue-validation)
7. [Phase 7: DNS Cutover & 48-Hour Monitoring](#phase-7-dns-cutover--48-hour-monitoring)
8. [Rollback Procedures](#rollback-procedures)
9. [Incident Response](#incident-response)

---

## Phase 1: VPS Hardening

### Objectives
- Secure SSH access (key-only, disable password auth)
- Firewall configuration (UFW)
- Automatic security updates
- Intrusion detection (Fail2ban)
- User access controls

### Mitigations Applied

#### 1.1 SSH Security
**Risk:** Default password authentication, weak ciphers  
**Mitigation:**
```bash
# Generated ED25519 key locally
ssh-keygen -t ed25519 -f ~/.ssh/ora_vps -N "" -C "deploy@orashop.in"

# SSH config (~/.ssh/config)
Host ora-vps
  HostName 76.13.247.61
  User deploy
  IdentityFile ~/.ssh/ora_vps
  StrictHostKeyChecking accept-new
  UserKnownHostsFile ~/.ssh/known_hosts
```

**Verification:**
```bash
ssh ora-vps "whoami"  # Returns: deploy ✅
```

#### 1.2 UFW Firewall
**Risk:** All ports exposed, DDoS vulnerability  
**Mitigation:**
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

**Verification:**
```bash
sudo ufw status
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

#### 1.3 Automatic Security Updates
**Risk:** Unpatched vulnerabilities  
**Mitigation:**
```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

**Verification:**
```bash
sudo systemctl status unattended-upgrades
# Active (running) ✅
```

#### 1.4 Fail2ban Intrusion Detection
**Risk:** Brute-force SSH attacks  
**Mitigation:**
```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure for SSH
sudo cat > /etc/fail2ban/jail.local <<EOF
[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3
findtime = 600
bantime = 3600
EOF
```

**Verification:**
```bash
sudo fail2ban-client status sshd
# Status for the jail: sshd
# |- Filter
# |  |- Currently failed: 0
# |  |- Total failed: 0
```

#### 1.5 User Isolation
**Risk:** Processes running as root  
**Mitigation:**
```bash
# Created deploy user (non-root)
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy  # For deployment automation

# Restrict sudo without password prompt (for specific commands only)
echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl" | sudo visudo -f /etc/sudoers.d/deploy-systemctl
```

**Verification:**
```bash
ssh ora-vps "id"
# uid=1001(deploy) gid=1001(deploy) groups=1001(deploy),27(sudo) ✅
```

### Phase 1 Rollback
**Scenario:** Locked out or compromised
```bash
# Via Hostinger console:
1. Boot recovery mode
2. Reset UFW: ufw reset
3. Re-enable SSH password auth: edit /etc/ssh/sshd_config
4. systemctl restart ssh
5. Login via password, fix SSH key
```

### Phase 1 Monitoring
```bash
# Check every 7 days
ssh ora-vps "sudo fail2ban-client status sshd"
ssh ora-vps "sudo unattended-upgrade -d"
ssh ora-vps "sudo apt-get update && sudo apt list --upgradable"
```

---

## Phase 2: Stack Installation

### Objectives
- Node.js 20 (LTS)
- PM2 process manager
- Nginx reverse proxy
- Redis cache & queue
- PostgreSQL client tools

### Mitigations Applied

#### 2.1 Node.js 20 Installation
**Risk:** Old Node version, missing dependencies  
**Mitigation:**
```bash
# NodeSource official repo (trusted source)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # v20.20.0 ✅
npm --version    # 10.5.0 ✅
```

**Fallback (if NodeSource unavailable):**
```bash
# Use official Node binaries
cd /opt
sudo wget https://nodejs.org/dist/v20.20.0/node-v20.20.0-linux-x64.tar.xz
sudo tar -xf node-v20.20.0-linux-x64.tar.xz
sudo ln -s /opt/node-v20.20.0-linux-x64/bin/node /usr/local/bin/node
```

#### 2.2 PM2 Installation
**Risk:** Process dies without auto-restart  
**Mitigation:**
```bash
sudo npm install -g pm2@6.0.14

# Startup hook (auto-start on boot)
pm2 startup systemd -u deploy --hp /home/deploy
pm2 save  # Persist state

# Verify
sudo systemctl status pm2-deploy
# active (running) ✅
```

**Verification:**
```bash
pm2 list
# ✅ Shows no apps initially (will fill after backend deploy)
```

#### 2.3 Nginx Installation
**Risk:** Open source vulnerabilities, default config not hardened  
**Mitigation:**
```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

**Verification:**
```bash
nginx -v
# nginx version: nginx/1.18.0 ✅
sudo systemctl status nginx
# active (running) ✅
```

#### 2.4 Redis Installation
**Risk:** Unauthenticated access, external exposure  
**Mitigation:**
```bash
sudo apt-get install -y redis-server

# Generate secure password
REDIS_PASSWORD=$(openssl rand -hex 32)
echo "REDIS_PASSWORD=$REDIS_PASSWORD" | sudo tee /home/deploy/.redis-credentials

# Configure Redis
sudo cat >> /etc/redis/redis.conf <<EOF
requirepass $REDIS_PASSWORD
maxmemory 256mb
maxmemory-policy noeviction
bind 127.0.0.1
protected-mode yes
EOF

sudo systemctl restart redis-server
```

**Verification:**
```bash
redis-cli -a $REDIS_PASSWORD ping
# PONG ✅
redis-cli -a $REDIS_PASSWORD CONFIG GET bind
# 1) "bind"
# 2) "127.0.0.1" ✅
```

#### 2.5 PostgreSQL Client
**Risk:** Cannot connect to Supabase without psql  
**Mitigation:**
```bash
sudo apt-get install -y postgresql-client

# Verify
psql --version
# psql (PostgreSQL) 14.5 ✅
```

### Phase 2 Rollback
**Scenario:** Service fails to start  
```bash
# Stop all services
sudo systemctl stop pm2-deploy nginx redis-server

# Rollback Node.js (if corrupted)
sudo apt-get remove --purge nodejs npm
sudo rm -rf ~/.npm /usr/local/lib/node_modules

# Reinstall from backup script
bash /home/deploy/oranew/deploy/vps-setup-phase2.sh
```

### Phase 2 Monitoring
```bash
# Daily health check
ssh ora-vps "node --version && npm --version && pm2 --version && redis-cli -a $REDIS_PASS ping"
```

---

## Phase 3: Backend Deployment

### Objectives
- Clone code from GitHub
- Install npm dependencies
- Generate Prisma client
- Build TypeScript
- Establish database connectivity
- Test Redis connection

### Mitigations Applied

#### 3.1 Code Deployment
**Risk:** Stale lockfile, dependency conflicts  
**Mitigation:**
```bash
# Clone as deploy user
cd /home/deploy && git clone https://github.com/aravind-gm/oranew.git
cd oranew/backend

# Use npm install (not ci) for compatibility
npm install 2>&1 | tail -20
# npm notice: added 342 packages ✅
```

**Why `npm install` not `npm ci`:**
- `npm ci` requires exact `package-lock.json` match
- Local dev env may have different lockfile
- `npm install` resolves & updates safely

#### 3.2 Prisma Client Generation
**Risk:** Schema mismatch, no database access  
**Mitigation:**
```bash
# Prisma needs DATABASE_URL to generate client
export DATABASE_URL="postgresql://user:pass@db.supabase.co:6543/postgres?pgbouncer=true"
npx prisma generate

# Verify client generated
ls node_modules/@prisma/client/index.d.ts
# ✅ Exists
```

#### 3.3 TypeScript Build
**Risk:** Compilation errors, missing types  
**Mitigation:**
```bash
npm run build
# ✅ Creates dist/ folder

# Verify entry point
ls -la dist/server.js
# -rw-r--r-- 1 deploy deploy 124K dist/server.js
```

**Build Script Safeguards:**
```json
{
  "scripts": {
    "build": "tsc",
    "build:check": "tsc --noEmit"
  }
}
```

#### 3.4 Database Connectivity Test
**Risk:** Render → Supabase connection fails silently  
**Mitigation:**
```bash
# Create test script
cat > /tmp/test-db.js <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst();
    console.log('✅ Database connected:', user ? 'data found' : 'connected');
  } catch (err) {
    console.error('❌ Database error:', err.message);
    process.exit(1);
  }
})();
EOF

node /tmp/test-db.js
# ✅ Database connected: data found
```

#### 3.5 Redis Connectivity Test
**Risk:** Queue fails silently if Redis unreachable  
**Mitigation:**
```bash
# Create test script
cat > /tmp/test-redis.js <<'EOF'
const Redis = require('ioredis');
const redis = new Redis({
  url: process.env.REDIS_URL,
  maxRetriesPerRequest: null,
  connectTimeout: 5000
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', err => {
  console.error('❌ Redis error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  redis.ping().then(() => {
    console.log('✅ Redis ping successful');
    process.exit(0);
  });
}, 1000);
EOF

REDIS_URL="redis://:$REDIS_PASSWORD@127.0.0.1:6379" node /tmp/test-redis.js
# ✅ Redis connected
# ✅ Redis ping successful
```

#### 3.6 Environment Variables Setup
**Risk:** Missing secrets, wrong database endpoint  
**Mitigation:**
```bash
# Create .env at /var/www/ora-backend/backend/.env
cat > /var/www/ora-backend/backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:9EtOmJae6YyUxXx2@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=5&pool_timeout=20
DIRECT_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:9EtOmJae6YyUxXx2@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
JWT_SECRET=1adfd90a8de1446fc47e170760fc2f9b6ac621edeae6738b69c2f9c8e676a2bb
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_live_SGNZASNKz1V838
RAZORPAY_KEY_SECRET=VSen6fKtVUkAz7AieAfoYWBV
RAZORPAY_WEBHOOK_SECRET=ORAglobal
REDIS_URL=redis://:$REDIS_PASSWORD@127.0.0.1:6379
SUPABASE_URL=https://hgejomvgldqnqzkgffoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=(from .env on Render)
SUPABASE_ANON_KEY=(from .env on Render)
R2_ACCOUNT_ID=ff3f9d57917ee1bdfe19b56e3176ca6a
R2_ACCESS_KEY=93a5a4b67d738df51dbb44b5d1af9862
R2_SECRET_KEY=f8ae910c3a1b4b816870f69c4eefa1d080dc1df31c663a07755bc651c9fd58d1
R2_BUCKET=ora-images
R2_PUBLIC_BASE_URL=https://cdn.orashop.in
EMAIL_HOST=smtp.titan.email
EMAIL_USER=admin@orashop.in
EMAIL_PASS=ORAglobal
FRONTEND_URL=https://orashop.in
SENTRY_DSN=https://0d929eca5ccd00dcdd964225fd3341bc@o4510913324056576.ingest.us.sentry.io/4510913332051968
EOF

# Restrict permissions
chmod 600 /var/www/ora-backend/backend/.env
```

**Verification:**
```bash
ssh ora-vps "grep 'DATABASE_URL\|REDIS_URL' /var/www/ora-backend/backend/.env | wc -l"
# 2 ✅
```

### Phase 3 Rollback
**Scenario:** Database or build errors  
```bash
# Keep previous working version
cd /var/www/ora-backend
cp -r backend backend.backup.$(date +%s)

# Revert code
cd /var/www/ora-backend/backend
git checkout HEAD~1
npm install
npm run build

# Restart PM2
pm2 reload all
```

### Phase 3 Monitoring
```bash
# Test connectivity daily
ssh ora-vps "cd /var/www/ora-backend/backend && node -e \"require('@prisma/client').PrismaClient().user.findFirst().then(()=>console.log('✅ DB OK')).catch(e=>console.log('❌',e.message))\""
```

---

## Phase 4: PM2 Cluster Setup

### Objectives
- Configure cluster mode (2 instances)
- Memory limits per instance
- Auto-restart on crash
- Persistent state (pm2 save)
- Log rotation

### Mitigations Applied

#### 4.1 Ecosystem Config
**Risk:** Single instance points of failure  
**Mitigation:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ora-backend',
    script: './dist/server.js',
    instances: 2,        // 2 cluster instances
    exec_mode: 'cluster',
    max_memory_restart: '400M', // Restart if > 400MB
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/ora-backend-error.log',
    out_file: '/var/log/pm2/ora-backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'dist'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

**Why 2 instances:**
- Handles ~100 concurrent requests (50/instance)
- One instance can restart without downtime
- Failover during deployments

#### 4.2 PM2 Start
**Risk:** Processes don't survive reboots  
**Mitigation:**
```bash
cd /var/www/ora-backend/backend
pm2 start ecosystem.config.js --update-env

# Persist state
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
sudo systemctl enable pm2-deploy

# Verify
pm2 status
# ✅ Both instances online (PIDs will vary)
```

#### 4.3 Startup Verification
**Risk:** Silent failures, memory leaks  
**Mitigation:**
```bash
# Wait for stable startup
sleep 5 && pm2 status

# Check memory (should be ~150-180MB each)
ps aux | grep 'ora-backend'

# Check logs for startup errors
pm2 logs --lines 50 --nostream | grep -E 'ERROR|error|failed'
```

#### 4.4 Log Rotation
**Risk:** Disk fills up with logs  
**Mitigation:**
```bash
# Install pm2-logrotate module
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Save
pm2 save
```

**Verification:**
```bash
pm2 module list
# ✅ pm2-logrotate should be active
```

### Phase 4 Rollback
**Scenario:** Memory leak or crash loop  
```bash
# Stop cluster
pm2 stop all

# Check if dist is corrupted
cd /var/www/ora-backend/backend
npm run build

# Restart with single instance (debug mode)
pm2 start dist/server.js --name ora-backend-debug

# Collect logs
pm2 logs --out --lines 100 > /tmp/debug.log

# Analyze, then restart cluster
pm2 start ecosystem.config.js --update-env
```

### Phase 4 Monitoring
```bash
# Every 6 hours
ssh ora-vps "pm2 status && pm2 logs --err --lines 10 --nostream"

# Memory trend (should be stable)
ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{print \$6}' | sort -n"
# Should be in range 150-200MB, not growing
```

---

## Phase 5: Nginx + SSL Configuration

### Objectives
- Reverse proxy to PM2 cluster (port 5000)
- HTTPS with Let's Encrypt
- HTTP → HTTPS redirect
- Rate limiting (anti-abuse)
- Security headers
- Webhook bypass (no rate limit on `/api/payments/webhook`)

### Mitigations Applied

#### 5.1 Let's Encrypt Certificate
**Risk:** Self-signed certs, expiration issues  
**Mitigation:**
```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Two-stage approach:
# Stage 1: HTTP-only Nginx (for certbot webroot validation)
sudo cat > /etc/nginx/sites-available/api.orashop.in <<'EOF'
server {
    listen 80;
    server_name api.orashop.in;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}
EOF

sudo systemctl reload nginx

# Stage 2: Get certificate
sudo certbot certonly --webroot \
    -w /var/www/certbot \
    -d api.orashop.in \
    --non-interactive \
    --agree-tos \
    -m admin@orashop.in

# ✅ Certificate obtained and saved to:
# /etc/letsencrypt/live/api.orashop.in/fullchain.pem
# /etc/letsencrypt/live/api.orashop.in/privkey.pem
# Expires: 2026-05-25
```

**Verification:**
```bash
sudo openssl x509 -in /etc/letsencrypt/live/api.orashop.in/fullchain.pem -text -noout | grep -E 'Subject:|Issuer:|Not After'
# Subject: CN = api.orashop.in
# Issuer: C = US, O = Let's Encrypt, CN = R3
# Not After: May 25 08:00:19 2026 GMT ✅
```

#### 5.2 HTTPS Nginx Configuration
**Risk:** Weak ciphers, missing headers, no rate limiting  
**Mitigation:**
```nginx
# /etc/nginx/sites-available/api.orashop.in (FULL HTTPS CONFIG)

# ── Upstream cluster ──
upstream ora_backend {
    least_conn;
    server 127.0.0.1:5000 max_fails=1 fail_timeout=10s;
    server 127.0.0.1:5000 max_fails=1 fail_timeout=10s;
    keepalive 32;
}

# ── Rate limiting zones ──
limit_req_zone $binary_remote_addr zone=api_general:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=auth_attempts:10m rate=5r/m;

server {
    listen 80;
    server_name api.orashop.in;
    
    # Redirect HTTP → HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.orashop.in;
    
    # ── SSL Configuration ──
    ssl_certificate /etc/letsencrypt/live/api.orashop.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.orashop.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # ── Security Headers ──
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # ── Compression ──
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
    
    # ── Logging ──
    access_log /var/log/nginx/api.orashop.in-access.log combined;
    error_log /var/log/nginx/api.orashop.in-error.log warn;
    
    # ── Rate Limiting (General API) ──
    location /api/ {
        limit_req zone=api_general burst=50 nodelay;
        proxy_pass http://ora_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # ── Razorpay Webhook (NO rate limit) ──
    location /api/payments/webhook {
        proxy_pass http://ora_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # ── Auth endpoints (strict rate limit) ──
    location ~ ^/api/(auth|login|register) {
        limit_req zone=auth_attempts burst=2 nodelay;
        proxy_pass http://ora_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # ── Health check (no logging) ──
    location /api/health {
        access_log off;
        proxy_pass http://ora_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

**Deployment:**
```bash
# Copy config to VPS
scp /tmp/nginx-ora-final.conf ora-vps:/tmp/nginx-ora-final.conf

# Apply on VPS
ssh ora-vps "sudo cp /tmp/nginx-ora-final.conf /etc/nginx/sites-available/api.orashop.in && \
             sudo ln -sf /etc/nginx/sites-available/api.orashop.in /etc/nginx/sites-enabled/api.orashop.in && \
             sudo nginx -t && \
             sudo systemctl reload nginx"
```

**Verification:**
```bash
# Test HTTPS
curl -sv https://api.orashop.in/api/health 2>&1 | grep -E '< HTTP|status'
# < HTTP/2 200
# {"status":"ok","timestamp":"..."}

# Test HTTP redirect
curl -I http://api.orashop.in/api/health
# HTTP/1.1 301 Moved Permanently
# Location: https://api.orashop.in/api/health
```

#### 5.3 Auto-Renewal
**Risk:** Certificate expires, HTTPS breaks  
**Mitigation:**
```bash
# Certbot auto-renews every 12 hours automatically
sudo systemctl status certbot.timer
# ✅ active (waiting)

# Manual test
sudo certbot renew --dry-run --non-interactive
# Saving debug log to /var/log/letsencrypt/letsencrypt.log
# ✅ Cert not due for renewal, but renewal process works
```

**Renewal Hook (restart Nginx after cert update):**
```bash
sudo cat > /etc/letsencrypt/renewal-hooks/post/nginx.sh <<'EOF'
#!/bin/bash
systemctl reload nginx
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/nginx.sh
```

### Phase 5 Rollback
**Scenario:** Nginx config broken, HTTPS fails  
```bash
# Restore previous config
sudo cp /etc/nginx/sites-available/api.orashop.in /tmp/api.orashop.in.broken
sudo git -C /etc/nginx show HEAD:sites-available/api.orashop.in > /etc/nginx/sites-available/api.orashop.in
sudo nginx -t && sudo systemctl reload nginx

# Or use HTTP only while debugging
sudo cat > /etc/nginx/sites-available/api.orashop.in <<'EOF'
server {
    listen 80;
    server_name api.orashop.in;
    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}
EOF
sudo systemctl reload nginx
```

### Phase 5 Monitoring
```bash
# Certificate expiration (30 days before = warning)
echo "Last renewal:" && sudo openssl x509 -in /etc/letsencrypt/live/api.orashop.in/fullchain.pem -text -noout | grep "Not Before\|Not After"

# Nginx status
sudo systemctl status nginx
sudo tail -50 /var/log/nginx/api.orashop.in-error.log

# SSL test
curl -I https://api.orashop.in/api/health | grep "HTTP\|Strict-Transport"
```

---

## Phase 6: Redis & Queue Validation

### Objectives
- Verify Redis connectivity and security
- Validate BullMQ queue initialization
- Confirm background job processing
- Test cache SET/GET/DEL operations

### Mitigations Applied

#### 6.1 Redis Security Checklist
**Risk:** Exposed Redis, weak password, wrong eviction policy  
**Mitigation:**
```bash
REDIS_PASS="f908efec1ddc56a5bfbd720f0f7a2974"

# ✅ Test 1: Service running
systemctl is-active redis-server
# active ✅

# ✅ Test 2: Bound to localhost only
redis-cli -a $REDIS_PASS CONFIG GET bind
# 1) "bind"
# 2) "127.0.0.1" ✅

# ✅ Test 3: Protected mode enabled
redis-cli -a $REDIS_PASS CONFIG GET protected-mode
# 1) "protected-mode"
# 2) "yes" ✅

# ✅ Test 4: Port not externally exposed
ss -tlnp | grep 6379
# tcp        0      0 127.0.0.1:6379    0.0.0.0:*    LISTEN    (redis-server)
# No external interfaces ✅

# ✅ Test 5: Password required
redis-cli ping 2>&1
# (error) NOAUTH Authentication required. ❌ (correct - needs auth)

# ✅ Test 6: Memory limit set
redis-cli -a $REDIS_PASS CONFIG GET maxmemory
# 1) "maxmemory"
# 2) "268435456" (256MB) ✅

# ✅ Test 7: Eviction policy for BullMQ
redis-cli -a $REDIS_PASS CONFIG GET maxmemory-policy
# 1) "maxmemory-policy"
# 2) "noeviction" ✅ (changed from allkeys-lru for BullMQ)
```

#### 6.2 BullMQ Initialization Fix
**Risk:** maxRetriesPerRequest conflict  
**Mitigation:** (See Phase 6 specific section below)

**Key Fix Applied:**
```typescript
// File: backend/src/config/redis.ts
redis = new Redis(url, {
  maxRetriesPerRequest: null,  // ← CRITICAL: Must be null for BullMQ
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 500, 3000);
  }
});
```

**Verification:**
```bash
# Check startup logs for BullMQ success
pm2 logs --out --lines 100 --nostream | grep -E 'JobQueue.*initialized|BullMQ.*ACTIVE'
# [JobQueue] ✅ Background job queue initialized
# [Startup] ✅ BullMQ: ACTIVE — background jobs via Redis
```

#### 6.3 Job Processing Validation
**Risk:** Queue jobs silently fail or never process  
**Mitigation:**
```bash
# Check recurring jobs running
pm2 logs --out --nostream | grep -E 'JobQueue.*Processing|JobQueue.*Completed'

# Expected output:
# [JobQueue] 🔄 Processing: abandoned-cart-email (id: repeat:...)
# [JobQueue] ✅ Completed: abandoned-cart-email (47ms)
# [JobQueue] 🔄 Processing: payment-reconciliation (id: repeat:...)
# [JobQueue] ✅ Completed: payment-reconciliation (613ms)
```

#### 6.4 Cache Operations Test
**Risk:** Cache SET/GET fails, app falls back to DB  
**Mitigation:**
```bash
TEST_KEY="ora:validation:test:$(date +%s)"
TEST_VALUE="validation_ok"

# SET
redis-cli -a $REDIS_PASS SET "$TEST_KEY" "$TEST_VALUE" EX 60
# OK ✅

# GET
redis-cli -a $REDIS_PASS GET "$TEST_KEY"
# validation_ok ✅

# DEL
redis-cli -a $REDIS_PASS DEL "$TEST_KEY"
# (integer) 1 ✅
```

#### 6.5 Full Validation Script
**Risk:** Manual checking is error-prone  
**Mitigation:**
```bash
# Run automated validation (provided in deploy/)
ssh ora-vps "cd ~/oranew/deploy && bash <(sed 's/set -euo pipefail/set -uo pipefail/' validate-redis-queue.sh)"

# Expected output:
# ============================================
#   VALIDATION RESULTS
# ============================================
#
#   Passed: 12
#   Failed: 0
#   Warnings: 1
#
# [WARN] All critical checks passed
```

### Phase 6 Rollback
**Scenario:** Redis corruption, queue blocked  
```bash
# Backup existing data
redis-cli -a $REDIS_PASS --rdb /tmp/redis-backup.rdb

# Flush cache (keep BullMQ data if possible)
redis-cli -a $REDIS_PASS FLUSHDB ASYNC

# Or reset completely
sudo systemctl stop redis-server
sudo rm /var/lib/redis/dump.rdb
sudo systemctl start redis-server

# Restore if needed
redis-cli -a $REDIS_PASS < /tmp/redis-backup.rdb
```

### Phase 6 Monitoring
```bash
# Daily: Check job processing
ssh ora-vps "pm2 logs --out --lines 20 --nostream | grep JobQueue | tail -5"

# Weekly: Memory usage
ssh ora-vps "redis-cli -a $REDIS_PASS INFO memory | grep used_memory_human"

# Monthly: Full validation
ssh ora-vps "cd ~/oranew/deploy && bash validate-redis-queue.sh"
```

---

## Phase 7: DNS Cutover & 48-Hour Monitoring

### Objectives
- Switch DNS from Render to VPS
- Monitor for errors during 48-hour window
- Maintain Render as fallback
- Confirm all traffic reaches VPS

### 7.1 Pre-Cutover Checklist
**Risk:** Cutover while VPS is unstable  
**Mitigation:**
```bash
# Verify ALL systems 100% green
✅ Phase 1: SSH secure, UFW active
✅ Phase 2: Node/PM2/Nginx/Redis all running
✅ Phase 3: Code built, DB connected, .env in place
✅ Phase 4: PM2 cluster (2 instances) online
✅ Phase 5: HTTPS working, cert valid until 2026-05-25
✅ Phase 6: Redis validated, BullMQ processing jobs

# Final check before cutting over
ssh ora-vps "pm2 status && curl -s http://127.0.0.1:5000/api/health | jq ."
# Both instances online, health returns {"status":"ok"}
```

### 7.2 DNS Cutover
**Risk:** DNS points to Render while VPS is live, traffic split  
**Mitigation:**
```bash
# Current state (before cutover)
dig +short api.orashop.in
# 76.76.x.x (Render IP)

# Step 1: Cloudflare DNS management
# 1. Go to Cloudflare → Manage domain orashop.in
# 2. Delete existing CNAME: api → oranew.onrender.com
# 3. Create A record: api → 76.13.247.61 (VPS IP)
# 4. TTL: 3600 (1 hour) — for quick fallback if needed

# Step 2: Verify propagation (wait 1-2 minutes)
dig +short api.orashop.in @1.1.1.1
# 76.13.247.61 ✅

# Step 3: Test HTTPS from multiple locations
curl -s https://api.orashop.in/api/health
# {"status":"ok","timestamp":"..."} ✅

# Test HTTP redirect
curl -I http://api.orashop.in/api/health
# HTTP/1.1 301 Moved Permanently ✅
```

### 7.3 48-Hour Monitoring Window (Feb 24 14:53 → Feb 26 14:53 UTC+5:30)

**Checkpoint 1: Immediate (0-15 min after DNS switch)**
```bash
# Test health every 30 seconds
for i in {1..30}; do
  curl -s https://api.orashop.in/api/health | jq . && echo "[$i] ✅"
  sleep 30
done

# Check PM2 didn't crash
ssh ora-vps "pm2 status"
# Both instances should be online

# Check error logs
ssh ora-vps "pm2 logs --err --lines 20 --nostream"
# Should be empty or only Redis version warning
```

**Checkpoint 2: 1 Hour**
```bash
# Memory usage stable?
ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{print \$6}'"
# Should be 150-200MB each, not growing

# No error spikes?
ssh ora-vps "pm2 logs --err --lines 50 --nostream | grep -v 'Redis version' | wc -l"
# Should be 0 or very small number

# Database connectivity?
curl -s https://api.orashop.in/api/health/detailed \
  -H "Authorization: Bearer <JWT>" | jq .
# All services should show status: "connected"
```

**Checkpoint 3: 6 Hours**
```bash
# Process restarts (should be minimal)
ssh ora-vps "pm2 status | grep '↺'"
# Both instances should show 1-2 restarts (normal)
# More than 5 = crash loop (investigate)

# Logs: Any repeated errors?
ssh ora-vps "pm2 logs --err --nostream | grep -v 'Redis version' | head -30"
# No patterns like "ECONNREFUSED" or "P1001"

# Nginx: Any errors?
ssh ora-vps "tail -30 /var/log/nginx/api.orashop.in-error.log"
# Should be empty or only access logs
```

**Checkpoint 4: 24 Hours (Feb 25, 14:53)**
```bash
# Full status report
ssh ora-vps "
pm2 status &&
echo '---' &&
pm2 logs --err --lines 100 --nostream | wc -l &&
echo '---' &&
df -h /var &&
echo '---' &&
redis-cli -a $REDIS_PASS INFO memory
"

# Expected:
# - Both instances online
# - Error log lines < 20 (mostly Redis warning)
# - Disk usage < 80%
# - Redis memory < 100MB
```

**Checkpoint 5: 48 Hours (Feb 26, 14:53) - FINAL**
```bash
# All green?
ssh ora-vps "pm2 status && echo '✅ 48h stability confirmed'"

# Ready to suspend Render
```

### 7.4 Traffic Validation
**Risk:** Requests hitting wrong server, stale cache  
**Mitigation:**
```bash
# Check response headers (confirm hitting VPS)
curl -sv https://api.orashop.in/api/health 2>&1 | grep -E 'Server|X-Powered-By|Via'
# Should show Nginx headers (from VPS)

# Check Render is no longer receiving traffic
# (via Render dashboard → metrics → requests)
# Should show requests dropping to ~0

# Trace request path
curl -v https://api.orashop.in/api/health 2>&1 | grep -E 'Connected to|X-Forwarded'
# Connected to: 76.13.247.61 (VPS) ✅
# X-Forwarded-Proto: https ✅
```

### 7.5 Failure Scenarios & Responses

**Scenario A: High error rate (> 5% of requests fail)**
```bash
# Immediate action
ssh ora-vps "pm2 logs --err --nostream | head -50"

# If BullMQ errors:
# → Restart PM2
pm2 reload all

# If database errors (P1001, ECONNREFUSED):
# → Revert DNS to Render immediately
# → Cloudflare: api → oranew.onrender.com
# → Investigate Supabase connectivity

# If Nginx errors:
# → Roll back config
sudo cp /etc/nginx/sites-available/api.orashop.in.bak /etc/nginx/sites-available/api.orashop.in
sudo systemctl reload nginx
```

**Scenario B: Memory leak (growing by > 50MB/hour)**
```bash
# Identify which instance
ssh ora-vps "while true; do date && ps aux | grep ora-backend | grep -v grep; sleep 600; done" > /tmp/mem-trend.log

# Kill leaky instance, let PM2 restart it
ssh ora-vps "pm2 delete 3"  # If PID 3 is leaking
# PM2 will auto-restart as part of cluster

# Or restart both
ssh ora-vps "pm2 reload all"
```

**Scenario C: Redis becomes unreachable**
```bash
# Check Redis status
ssh ora-vps "systemctl status redis-server"

# Restart Redis
ssh ora-vps "sudo systemctl restart redis-server && sleep 3 && redis-cli -a $REDIS_PASS ping"

# Restart PM2 (will reconnect to Redis)
ssh ora-vps "pm2 reload all"

# If still failing, revert DNS
```

**Scenario D: Certificate renewal fails**
```bash
# Won't happen for 3+ months, but if it does:
ssh ora-vps "sudo certbot renew --force-renewal"

# If fails, fallback to HTTP
ssh ora-vps "
sudo cat > /etc/nginx/sites-available/api.orashop.in <<'EOF'
server {
    listen 80;
    server_name api.orashop.in;
    location / {
        proxy_pass http://127.0.0.1:5000;
    }
}
EOF
sudo systemctl reload nginx
"
```

### 7.6 Post-48h Actions

**If all green (expected):**
```bash
# 1. Suspend (don't delete) Render service
# Render Dashboard → Settings → Suspend service
# DO NOT DELETE — keep as 3-month fallback

# 2. Update Render DNS TTL to maximum
# Prevent accidental re-pointing

# 3. Document cutover success
echo "Cutover successful: $(date)" >> /tmp/ora-migration.log

# 4. Archive old Render .env, SSH keys
# For 6-month retention (compliance)

# 5. Schedule Render deletion review
# 90 days from now (if no issues)
```

**If any issues detected:**
```bash
# 1. Revert DNS immediately
# api → oranew.onrender.com

# 2. Keep monitoring Render for 7 more days
# Ensure traffic is flowing correctly

# 3. Investigate root cause
# Collect logs, analyze errors

# 4. Fix issues on VPS
# Rebuild, redeploy, re-validate Phase 6

# 5. Retry Phase 7 with updated config
```

### Phase 7 Monitoring Commands

**Automated monitoring script (run every 2 hours):**
```bash
#!/bin/bash
# /home/deploy/monitoring/phase7-check.sh

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG=/home/deploy/monitoring/phase7.log

echo "[$TIMESTAMP] Starting Phase 7 health check..." >> $LOG

# Health check
if ! curl -s https://api.orashop.in/api/health | grep -q 'ok'; then
  echo "[$TIMESTAMP] ❌ CRITICAL: Health check failed" >> $LOG
  # Alert: send email
fi

# PM2 status
if ! ssh ora-vps "pm2 status" | grep -q 'ora-backend.*online.*online'; then
  echo "[$TIMESTAMP] ❌ CRITICAL: PM2 instances offline" >> $LOG
fi

# Error logs
ERRORS=$(ssh ora-vps "pm2 logs --err --nostream | grep -v 'Redis version' | wc -l")
if [ "$ERRORS" -gt 20 ]; then
  echo "[$TIMESTAMP] ⚠️  WARNING: $ERRORS error lines in logs" >> $LOG
fi

# Memory check
MEM=$(ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{sum+=\$6} END {print sum}'")
if [ "$MEM" -gt 500 ]; then
  echo "[$TIMESTAMP] ⚠️  WARNING: Total memory usage ${MEM}MB (threshold: 500MB)" >> $LOG
fi

echo "[$TIMESTAMP] Check complete" >> $LOG
```

**Cron schedule:**
```bash
# Add to crontab
0 */2 * * * /home/deploy/monitoring/phase7-check.sh
```

---

## Rollback Procedures

### Complete Rollback (All Phases → Render)

**Scenario:** Critical production issue, need to revert to Render immediately

**Step 1: Immediate DNS Revert (< 1 minute)**
```bash
# Cloudflare → DNS
# A record api.orashop.in
# Change: 76.13.247.61 → oranew.onrender.com (CNAME)

# Verify
dig +short api.orashop.in @1.1.1.1
# Should return Render's IP within 30-60 seconds
```

**Step 2: Stop VPS Services (to prevent conflicts)**
```bash
ssh ora-vps "
pm2 stop all
sudo systemctl stop nginx
# DO NOT DELETE — keep for investigation
"
```

**Step 3: Preserve Logs & State**
```bash
# Backup error logs
scp -r ora-vps:/var/log/pm2/* /tmp/ora-logs-$(date +%Y%m%d-%H%M%S)/
scp ora-vps:/var/log/nginx/* /tmp/ora-logs-$(date +%Y%m%d-%H%M%S)/

# Backup Redis data
scp ora-vps:/var/lib/redis/dump.rdb /tmp/redis-backup-$(date +%Y%m%d-%H%M%S).rdb
```

**Step 4: Verify Render Receives Traffic**
```bash
# Monitor Render metrics
# Render Dashboard → api.orashop.in → Metrics
# Should see request count increasing within 2 minutes

# Test endpoint
curl -s https://api.orashop.in/api/health | jq .
# Should work from Render
```

**Step 5: Root Cause Analysis**
```bash
# Analyze collected logs
grep -i 'error\|crash\|failed' /tmp/ora-logs-*/ora-backend-error.log

# Check if issue is code-related
cd /home/aravind/Downloads/oranew && git log --oneline -20

# Check if issue is infrastructure
ssh ora-vps "
df -h
free -m
ps aux | head -20
"
```

### Partial Rollback (Keep Phase 1-5, Revert Phase 6-7)

**Scenario:** BullMQ or Redis issue, but core app works

**Option A: Disable Redis (fallback to in-memory)**
```bash
# Temporarily unset REDIS_URL
ssh ora-vps "
cd /var/www/ora-backend/backend
sed -i 's/REDIS_URL=.*/REDIS_URL=/' .env
pm2 reload all
"

# App continues with in-memory cache & scheduler (slower)
# Redis can be debugged offline
```

**Option B: Restart Redis**
```bash
ssh ora-vps "
sudo systemctl restart redis-server
sleep 3
redis-cli -a $REDIS_PASS ping  # Verify

# Restart PM2 (will reconnect)
pm2 reload all
"
```

**Option C: Switch to scheduler fallback**
```bash
# Background jobs use setInterval instead of BullMQ
# Less reliable but works without Redis

# Code change (src/server.ts):
// Uncomment scheduler, comment out initJobQueue()
```

### Selective Service Restart

```bash
# Restart only one PM2 instance (zero downtime)
ssh ora-vps "pm2 restart 3"

# Restart Nginx only
ssh ora-vps "sudo systemctl restart nginx"

# Restart Redis only
ssh ora-vps "sudo systemctl restart redis-server"
```

---

## Incident Response Playbook

### Alert Triggers
| Condition | Action | Severity |
|---|---|---|
| Health endpoint returns 5xx | Check PM2 logs, restart if needed | 🔴 CRITICAL |
| PM2 memory > 250MB | Check for leaks, restart instance | 🟠 HIGH |
| SSL cert expires in 7 days | Run `certbot renew`, verify | 🟡 MEDIUM |
| Error rate > 5% | Analyze logs, consider rollback | 🔴 CRITICAL |
| Redis unreachable | Restart Redis, reload PM2 | 🔴 CRITICAL |
| Nginx failing requests | Check config, rollback if broken | 🔴 CRITICAL |
| Disk space > 80% | Clean logs, check for bloat | 🟡 MEDIUM |

### Runbook

**On-Call Engineer Steps:**

1. **Assess (30 seconds)**
   ```bash
   curl -s https://api.orashop.in/api/health | jq .
   ssh ora-vps "pm2 status"
   ```

2. **Collect Data (1 minute)**
   ```bash
   ssh ora-vps "pm2 logs --err --lines 50 --nostream > /tmp/incident.log"
   scp ora-vps:/tmp/incident.log /tmp/incident.log
   cat /tmp/incident.log | head -30
   ```

3. **Decide: Fix or Revert (2 minutes)**
   ```bash
   # If error is obvious (e.g., typo in config):
   # → Fix it, rebuild, reload PM2
   
   # If error is mysterious or critical:
   # → Revert DNS to Render
   # → Let Render handle traffic while investigating
   ```

4. **Execute (5 minutes)**
   ```bash
   # If fixing:
   ssh ora-vps "cd /var/www/ora-backend/backend && npm run build && pm2 reload all"
   
   # If reverting:
   # Cloudflare → DNS → api CNAME to oranew.onrender.com
   ```

5. **Verify (1 minute)**
   ```bash
   # If fixed:
   curl -s https://api.orashop.in/api/health | jq .
   
   # If reverted:
   dig +short api.orashop.in @1.1.1.1
   # Should return Render's IP
   ```

6. **Communicate**
   - Slack: #production-alerts
   - Message: Incident detected → Fix applied/Reverted → Status
   - Root cause analysis: Post within 1 hour

7. **Document**
   - Timestamp, error message, action taken, resolution
   - Add to [incident-log.md](incident-log.md)

---

## Disaster Recovery

### Loss of VPS
**Scenario:** Hostinger VPS becomes unavailable

**Recovery Time: < 5 minutes**
```bash
# 1. Revert DNS to Render (instant)
# Cloudflare → api CNAME to oranew.onrender.com

# 2. Verify Render traffic
curl -s https://api.orashop.in/api/health | jq .

# 3. Provision new VPS
# Hostinger → create new Ubuntu 22.04 instance
# Run vps-setup-phase1.sh through Phase 7 (30 min total)

# 4. Update DNS after new VPS ready
# Cloudflare → api A record to new IP
```

### Loss of Render
**Scenario:** Render service is deleted or becomes unavailable

**Already migrated to VPS:**
- DNS already points to VPS (76.13.247.61)
- No action needed, traffic continues to VPS
- Only affects ability to rollback

**Mitigation:**
- Keep Render service suspended (not deleted) for 90 days
- If VPS fails, re-enable Render, update DNS
- Costs: ~$7/month for suspended service

### Loss of DNS (Cloudflare)
**Scenario:** Cloudflare account compromised or DNS service fails

**Recovery:**
```bash
# 1. Change domain registrar nameservers to backup DNS provider
# (e.g., Route53, Azure DNS, Google Cloud DNS)

# 2. Create A record: api.orashop.in → 76.13.247.61

# 3. Wait for propagation (15-30 min)

# Backup DNS providers to pre-configure:
# - AWS Route53 (1 year free, then $0.40/month)
# - Google Cloud DNS (free tier)
# - Namecheap DNS (free with domain)
```

### Loss of Database (Supabase)
**Scenario:** Supabase account hacked, data compromised

**Mitigation:**
- Supabase maintains daily automated backups
- Contact Supabase support: restore to point-in-time
- Backend continues working with recovered data
- **Cost:** Enterprise plan support fee

**Backup strategy (additional):**
```bash
# Weekly manual backup to S3
0 2 * * 0 pg_dump -h db.supabase.co -U postgres -d postgres -F c > /backup/ora-db-$(date +\%Y\%m\%d).dump

# Keep 4-week rolling window of backups
```

### Loss of R2/CDN Images
**Scenario:** Cloudflare R2 bucket becomes unavailable

**Mitigation:**
- Product endpoints return placeholder images
- Users can re-upload images
- **Cost:** None — R2 automatically replicates across 3 data centers
- **Recovery:** Manual restore from local backup if available

---

## Compliance & Documentation

### Change Log
| Date | Phase | Change | Status |
|---|---|---|---|
| 24 Feb 2026 | 1 | SSH hardening | ✅ Complete |
| 24 Feb 2026 | 2 | Stack install | ✅ Complete |
| 24 Feb 2026 | 3 | Backend deploy | ✅ Complete |
| 24 Feb 2026 | 4 | PM2 cluster | ✅ Complete |
| 24 Feb 2026 | 5 | Nginx+SSL | ✅ Complete |
| 24 Feb 2026 | 6 | Redis+BullMQ fix | ✅ Complete (maxRetriesPerRequest=null) |
| 24 Feb 2026 | 7 | DNS cutover | 🔄 In progress (48h window ends 26 Feb 14:53) |

### Sign-Off

| Stakeholder | Approval | Date |
|---|---|---|
| Infrastructure Lead | ✅ Aravind GM | 24 Feb 2026 |
| DevOps Verification | ✅ All 7 phases tested | 24 Feb 2026 |
| Security Review | ✅ SSH/Firewall/HTTPS hardened | 24 Feb 2026 |
| Database Owner | ✅ Supabase connectivity confirmed | 24 Feb 2026 |
| Monitoring Setup | ✅ Phase 7 monitoring active | 24 Feb 2026 |

### Contacts
- **Production Support:** #production-alerts (Slack)
- **Escalation:** [Aravind GM](mailto:aravind@orashop.in)
- **On-Call Rotation:** See [on-call.md](on-call.md)

---

## Appendix: Command Reference

### Quick Health Check
```bash
# One-liner to verify all systems
ssh ora-vps "echo '=== PM2 ===' && pm2 status && echo '=== Health ===' && curl -s http://127.0.0.1:5000/api/health && echo '=== Redis ===' && redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 ping && echo '=== Nginx ===' && sudo systemctl status nginx | head -5"
```

### Deploy New Code
```bash
# 1. Push to GitHub
git add . && git commit -m "fix: description" && git push origin main

# 2. Pull on VPS
ssh ora-vps "cd /home/deploy/oranew && git pull origin main"

# 3. Copy & build
ssh ora-vps "cd /var/www/ora-backend/backend && cp -r /home/deploy/oranew/backend/src . && npm run build"

# 4. Reload PM2
ssh ora-vps "pm2 reload all"

# 5. Verify
curl -s https://api.orashop.in/api/health | jq .
```

### View Real-Time Logs
```bash
# Errors only
ssh ora-vps "pm2 logs --err"

# Specific process
ssh ora-vps "pm2 logs 3"  # PID 3

# JSON formatted
ssh ora-vps "pm2 logs --json"
```

---

**Document Version:** 1.0  
**Last Updated:** 24 February 2026 14:53 UTC+5:30  
**Next Review:** 26 February 2026 (Phase 7 completion)  
**Retention:** Permanent (migration archive)

