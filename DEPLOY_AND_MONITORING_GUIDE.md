# Deploy & Monitoring Guide — Production Workflow

**Updated:** 24 February 2026  
**Environment:** VPS production (76.13.247.61)  
**SSH Alias:** `ora-vps` (deploy user)  
**Deploy Location:** `/var/www/ora-backend/backend/`  
**PM2 Cluster:** 2 instances (PIDs 3 & 4, port 5000)

---

## Part 1: Deploying New Code

### Standard Deployment Flow

#### Step 1: Make Code Changes Locally

```bash
# Navigate to project
cd /home/aravind/Downloads/oranew

# Create feature branch (optional but recommended)
git checkout -b feature/my-fix

# Make your changes
# Example: Edit backend/src/services/orderService.ts
nano backend/src/services/orderService.ts

# Check what changed
git status
# On branch feature/my-fix
# Changes not staged for commit:
#   modified: backend/src/services/orderService.ts
```

#### Step 2: Type Check (Before Commit)

```bash
# Verify TypeScript compiles
cd backend
npm run build:check  # Check without emitting files
# or
npm run build        # Full build + emit dist/
```

#### Step 3: Commit & Push

```bash
# Stage changes
git add backend/src/services/orderService.ts
# or add everything
git add .

# Commit with descriptive message
git commit -m "fix: improve order processing logic

- Fixed race condition in payment reconciliation
- Added retry logic for failed webhook events
- Improved error logging for debugging

Fixes: #123"

# Push to GitHub main branch
git push origin main
# or to feature branch
git push origin feature/my-fix
```

**Commit Message Format (Conventional Commits):**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `fix:`, `feat:`, `refactor:`, `docs:`, `perf:`, `chore:`, `ci:`, `test:`  
**Scopes:** `redis`, `auth`, `orders`, `payments`, `admin`, `db`, `api`

#### Step 4: Deploy to VPS (Zero-Downtime)

**Option A: One-Command Deployment**

```bash
# All-in-one deploy script
ssh ora-vps "
cd /home/deploy/oranew && \
git pull origin main && \
cd /var/www/ora-backend/backend && \
cp -r /home/deploy/oranew/backend/src . && \
npm run build && \
pm2 reload all --update-env
"

# Watch for success
echo "Waiting 5s for PM2 to reload..."
sleep 5
ssh ora-vps "pm2 status"
```

**Option B: Manual Steps (For Control/Debugging)**

```bash
# Step 1: Pull latest code
ssh ora-vps "cd /home/deploy/oranew && git pull origin main"
# Output should show: Fast-forward <files changed>

# Step 2: Copy source to app directory
ssh ora-vps "cp -r /home/deploy/oranew/backend/src /var/www/ora-backend/backend/"

# Step 3: Type check (optional but recommended)
ssh ora-vps "cd /var/www/ora-backend/backend && npm run build:check"
# Should exit with code 0 (no errors)

# Step 4: Full build
ssh ora-vps "cd /var/www/ora-backend/backend && npm run build"
# Output: "Successfully compiled X lines"

# Step 5: Reload PM2 (zero-downtime)
ssh ora-vps "pm2 reload all --update-env"
# Output: "[PM2] Applying action reloadProcessId on app [all]"

# Step 6: Verify
ssh ora-vps "pm2 status"
ssh ora-vps "curl -s http://127.0.0.1:5000/api/health"
```

**Option C: Rollback (If Deployment Fails)**

```bash
# Revert to previous version immediately
ssh ora-vps "
cd /home/deploy/oranew && \
git revert HEAD --no-edit && \
cd /var/www/ora-backend/backend && \
cp -r /home/deploy/oranew/backend/src . && \
npm run build && \
pm2 reload all
"

# Or revert to last known good commit
ssh ora-vps "
cd /home/deploy/oranew && \
git checkout HEAD~1 && \
cd /var/www/ora-backend/backend && \
cp -r /home/deploy/oranew/backend/src . && \
npm run build && \
pm2 reload all
"

# Verify rollback
curl -s https://api.orashop.in/api/health | jq .
```

---

### Advanced Deployment Scenarios

#### A. Deploy with Environment Variable Changes

```bash
# Update .env on VPS
ssh ora-vps "
cat > /var/www/ora-backend/backend/.env <<'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
REDIS_URL=redis://:password@127.0.0.1:6379
# ... other vars ...
EOF
"

# Then deploy code
ssh ora-vps "
cd /home/deploy/oranew && git pull origin main && \
cd /var/www/ora-backend/backend && \
cp -r /home/deploy/oranew/backend/src . && \
npm run build && \
pm2 reload all --update-env
"
```

#### B. Deploy Database Migration + Code

```bash
# WARNING: Only if migration is safe and tested locally!

ssh ora-vps "
# 1. Pull code
cd /home/deploy/oranew && git pull origin main

# 2. Build
cd /var/www/ora-backend/backend && \
cp -r /home/deploy/oranew/backend/src . && \
npm run build

# 3. Run migration (CAREFUL!)
npx prisma migrate deploy || echo '⚠️  Migration may have failed'

# 4. Reload PM2
pm2 reload all
"

# Check for migration errors
ssh ora-vps "pm2 logs --err --lines 20 --nostream | grep -i 'migration\|prisma\|error'"
```

#### C. Deploy Specific Files Only (Hotfix)

```bash
# Edit single file
nano backend/src/controllers/orderController.ts

# Commit
git add backend/src/controllers/orderController.ts
git commit -m "hotfix: fix order validation bug"
git push origin main

# Deploy
ssh ora-vps "
cd /home/deploy/oranew && git pull origin main && \
cd /var/www/ora-backend/backend && \
npm run build && \
pm2 reload all
"
```

#### D. Deploy with Zero Downtime (Graceful Reload)

```bash
# PM2 graceful reload (waits for in-flight requests to complete)
ssh ora-vps "pm2 reload all --update-env"

# Monitor reload progress
ssh ora-vps "watch -n 1 'pm2 status'"
# Watch both instances show consistent uptime (not jumping to 0s)

# Real-time health monitoring during reload
while true; do
  STATUS=$(curl -s https://api.orashop.in/api/health 2>&1)
  echo "[$(date '+%H:%M:%S')] $STATUS"
  sleep 1
done
```

---

## Part 2: Monitoring Logs

### Real-Time Log Monitoring

#### View All Logs (Streaming)

```bash
# Live streaming (updates in real-time)
ssh ora-vps "pm2 logs"

# In separate terminal, trigger test requests
curl -s https://api.orashop.in/api/health | jq .
curl -s https://api.orashop.in/api/products | jq .

# Logs will show:
# 3|ora-back | [Startup] GET /api/health 200 5ms
# 3|ora-back | [Startup] GET /api/products 200 145ms
```

#### View Error Logs Only

```bash
# Last 50 error lines (non-streaming)
ssh ora-vps "pm2 logs --err --lines 50 --nostream"

# Streaming errors
ssh ora-vps "pm2 logs --err"

# Expected:
# 3|ora-back | {"message":"[JobQueue] ⚠️  ... (warnings only)
# (Should be mostly empty in production)
```

#### View Output Logs (Successful Operations)

```bash
# Last 50 successful lines
ssh ora-vps "pm2 logs --out --lines 50 --nostream"

# Streaming
ssh ora-vps "pm2 logs --out"

# Expected:
# 3|ora-back | {"message":"[Startup] Redis: CONNECTED\n",...}
# 3|ora-back | {"message":"[JobQueue] ✅ Completed: payment-reconciliation\n",...}
```

#### View Logs from Specific Process

```bash
# Only PID 3
ssh ora-vps "pm2 logs 3"

# Only PID 4
ssh ora-vps "pm2 logs 4"

# Both streaming
ssh ora-vps "pm2 logs --merge-logs"
```

#### View Raw Log Files

```bash
# Error log file
ssh ora-vps "cat /var/log/pm2/ora-backend-error.log"

# Output log file
ssh ora-vps "cat /var/log/pm2/ora-backend-out.log"

# Tail last 100 lines
ssh ora-vps "tail -100 /var/log/pm2/ora-backend-out.log"

# Follow (like tail -f)
ssh ora-vps "tail -f /var/log/pm2/ora-backend-out.log"
```

---

### Log Analysis & Filtering

#### Find Specific Errors

```bash
# Search for database errors
ssh ora-vps "pm2 logs --err --nostream | grep -i 'database\|connection\|P1001\|P1002\|ECONNREFUSED'"

# Search for Redis errors
ssh ora-vps "pm2 logs --err --nostream | grep -i 'redis\|NOAUTH\|connection refused'"

# Search for Razorpay webhook errors
ssh ora-vps "pm2 logs --err --nostream | grep -i 'webhook\|razorpay'"

# Search for specific timestamp
ssh ora-vps "pm2 logs --nostream | grep '2026-02-24 14:5[0-9]'"
```

#### Count Errors by Type

```bash
# Total error count (last hour)
ssh ora-vps "pm2 logs --err --nostream | wc -l"

# Group errors
ssh ora-vps "pm2 logs --err --nostream | jq '.message' 2>/dev/null | sort | uniq -c | sort -rn"

# Most common error message
ssh ora-vps "pm2 logs --err --nostream | jq '.message' 2>/dev/null | sort | uniq -c | sort -rn | head -1"
```

#### Monitor in Real-Time with Grep

```bash
# Watch for specific events (streaming)
ssh ora-vps "pm2 logs | grep 'JobQueue'
# Will show only background job updates

# Watch for errors (streaming)
ssh ora-vps "pm2 logs | grep -E 'error|ERROR|failed|FAILED|❌'

# Watch for Redis events
ssh ora-vps "pm2 logs | grep Redis
```

#### Create Custom Log Monitoring Script

```bash
#!/bin/bash
# monitor-production.sh — Run locally

while true; do
  clear
  echo "=== ORA Production Status — $(date '+%Y-%m-%d %H:%M:%S') ==="
  echo ""
  
  # PM2 status
  echo "--- PM2 Status ---"
  ssh ora-vps "pm2 status" 2>/dev/null | tail -4
  
  # Recent errors
  echo ""
  echo "--- Recent Errors (last 5) ---"
  ssh ora-vps "pm2 logs --err --lines 5 --nostream" 2>/dev/null | grep -v "Redis version"
  
  # Queue jobs
  echo ""
  echo "--- Job Queue Activity (last 3) ---"
  ssh ora-vps "pm2 logs --out --nostream" 2>/dev/null | grep JobQueue | tail -3
  
  # Memory usage
  echo ""
  echo "--- Memory Usage ---"
  ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{print \$6}' | sort -n" 2>/dev/null
  
  # Wait 30 seconds
  sleep 30
done

# Run it
bash monitor-production.sh
```

---

### Performance & Health Monitoring

#### Check Memory Usage

```bash
# Current memory (MB)
ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{print \$6}'"
# Expected: 150-200MB per instance

# Memory trend (run every 5 minutes, capture multiple readings)
for i in {1..10}; do
  echo "$(date '+%H:%M:%S'): $(ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{sum+=\$6} END {print sum}'" 2>/dev/null) MB"
  sleep 30
done

# Graph memory over time
ssh ora-vps "
for i in {1..60}; do
  echo \"[$(date '+%H:%M:%S')] $(ps aux | grep ora-backend | grep -v grep | awk '{sum+=\$6} END {print sum}')MB\"
  sleep 5
done
"
```

#### Check Response Time

```bash
# Single request timing
time curl -s https://api.orashop.in/api/health > /dev/null
# Expected: real 0m0.150s (< 200ms)

# Average response time over 10 requests
for i in {1..10}; do
  time curl -s https://api.orashop.in/api/health > /dev/null 2>&1
done

# Response time with detailed breakdown
curl -w "
  Time to connect: %{time_connect}s
  Time to first byte: %{time_starttransfer}s
  Total time: %{time_total}s
" -o /dev/null -s https://api.orashop.in/api/health
```

#### Monitor PM2 Restart Count

```bash
# Check if processes are restarting frequently
ssh ora-vps "pm2 status | grep ora-backend"

# Look at ↺ column — should be 1-2, not 10+
# If > 5: Investigate crash loop
#   → Check logs: pm2 logs --err --lines 50
#   → Likely causes: Out of memory, database connection error, corrupt config

# Reset restart count
ssh ora-vps "pm2 reset all"
```

#### Check Database Connection Health

```bash
# Query database via backend health endpoint
curl -s https://api.orashop.in/api/health/detailed \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" | jq .

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "redis": "connected",
#   "supabaseStorage": "connected",
#   "timestamp": "2026-02-24T14:25:00.000Z"
# }

# If any service shows "disconnected": Alert!
```

#### Monitor Redis Health

```bash
# Redis memory usage
ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 INFO memory | grep used_memory_human"
# Expected: 1023.31K to 50MB (normal for cache)

# Redis key count
ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 DBSIZE"
# Expected: 100-1000 keys (depending on traffic)

# Redis active connections
ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 INFO clients | grep connected_clients"
# Expected: 5-10 connections (normal)

# Redis commands per second
ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 INFO stats | grep total_commands_processed"
# Track over time to spot spikes
```

---

## Part 3: Troubleshooting Common Issues

### Issue: High Error Rate After Deploy

```bash
# Step 1: Check what changed
ssh ora-vps "cd /home/deploy/oranew && git log --oneline -5"

# Step 2: View recent errors
ssh ora-vps "pm2 logs --err --lines 100 --nostream | head -20"

# Step 3: Quick fix options:
# Option A: Rollback
ssh ora-vps "cd /home/deploy/oranew && git revert HEAD --no-edit && cd /var/www/ora-backend/backend && npm run build && pm2 reload all"

# Option B: Fix and redeploy
# ... Edit code locally, commit, push, then deploy again
```

### Issue: Memory Leak (Growing Memory Usage)

```bash
# Step 1: Confirm leak
for i in {1..5}; do
  ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{print \$6}'"
  sleep 60
done

# Step 2: If increasing > 10MB/min = leak

# Step 3: Restart leaky instance
ssh ora-vps "pm2 restart 3"  # Restart PID 3 (other instance keeps serving)

# Step 4: Monitor if leak stops
for i in {1..10}; do
  ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '{print \$6}'"
  sleep 30
done

# Step 5: If leak resumes = code issue
# Investigate in logs, check for unclosed connections, etc.
```

### Issue: Slow Responses (> 500ms)

```bash
# Step 1: Measure latency
for i in {1..5}; do
  curl -w "Response time: %{time_total}s\n" -o /dev/null -s https://api.orashop.in/api/health
done

# Step 2: Check database latency
# (via /api/health/detailed endpoint)

# Step 3: Check Redis latency
ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 --latency"

# Step 4: Check Nginx
ssh ora-vps "tail -20 /var/log/nginx/api.orashop.in-access.log"

# Step 5: Restart PM2 if high CPU
ssh ora-vps "pm2 restart all"
```

### Issue: Redis Connection Errors

```bash
# Check Redis status
ssh ora-vps "systemctl status redis-server"

# Test connection
ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 ping"
# Should return: PONG

# If not responding:
ssh ora-vps "sudo systemctl restart redis-server && sleep 3 && redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 ping"

# Reload PM2 to reconnect
ssh ora-vps "pm2 reload all"
```

### Issue: Database Connection Refused

```bash
# Check DATABASE_URL in .env
ssh ora-vps "grep DATABASE_URL /var/www/ora-backend/backend/.env"

# Verify Supabase is running
# (Check Supabase dashboard status)

# Test connection locally on VPS
ssh ora-vps "
cd /var/www/ora-backend/backend && \
node -e \"
const { PrismaClient } = require('@prisma/client');
new PrismaClient().user.findFirst().then(() => console.log('✅ DB OK')).catch(e => console.log('❌', e.message));
\"
"

# If fails: Update DATABASE_URL with correct endpoint
ssh ora-vps "
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://new:endpoint@...|' /var/www/ora-backend/backend/.env
cd /var/www/ora-backend/backend && pm2 reload all
"
```

---

## Part 4: Log Management

### Rotate & Clean Old Logs

```bash
# PM2 logrotate is auto-configured, but manual cleanup:

# See current log files
ssh ora-vps "ls -lh /var/log/pm2/"

# Delete logs older than 30 days
ssh ora-vps "find /var/log/pm2 -name '*.log' -mtime +30 -delete"

# Archive old logs
ssh ora-vps "
cd /var/log/pm2
tar -czf ora-backend-logs-$(date +%Y%m%d).tar.gz *.log
rm -f *.log
"

# Download archived logs
scp ora-vps:/var/log/pm2/ora-backend-logs-20260224.tar.gz /tmp/
tar -xzf /tmp/ora-backend-logs-20260224.tar.gz -C /tmp/
```

### Centralized Logging (Optional)

```bash
# Send logs to external service (Sentry, Loggly, etc.)
# Already configured in .env:
# SENTRY_DSN=https://0d929eca5ccd00dcdd964225fd3341bc@o4510913324056576.ingest.us.sentry.io/...

# View in Sentry dashboard
# https://o4510913324056576.ingest.us.sentry.io/4510913332051968
```

---

## Part 5: Quick Reference Commands

### One-Liners

```bash
# Deploy latest code
alias deploy='cd /home/aravind/Downloads/oranew && git push origin main && ssh ora-vps "cd /home/deploy/oranew && git pull origin main && cd /var/www/ora-backend/backend && cp -r /home/deploy/oranew/backend/src . && npm run build && pm2 reload all"'

# Watch logs
alias logs='ssh ora-vps "pm2 logs"'

# Watch errors only
alias errors='ssh ora-vps "pm2 logs --err"'

# Check status
alias status='ssh ora-vps "pm2 status && echo && curl -s https://api.orashop.in/api/health | jq ."'

# Restart all
alias restart='ssh ora-vps "pm2 restart all"'

# View memory
alias mem='ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '\''{print \$6}'\'' | sort -n"'

# Rollback
alias rollback='ssh ora-vps "cd /home/deploy/oranew && git revert HEAD --no-edit && cd /var/www/ora-backend/backend && npm run build && pm2 reload all"'
```

**Add to `~/.bashrc`:**
```bash
cat >> ~/.bashrc <<'EOF'
# ORA Production shortcuts
alias deploy='cd /home/aravind/Downloads/oranew && git push origin main && ssh ora-vps "cd /home/deploy/oranew && git pull origin main && cd /var/www/ora-backend/backend && cp -r /home/deploy/oranew/backend/src . && npm run build && pm2 reload all"'
alias logs='ssh ora-vps "pm2 logs"'
alias errors='ssh ora-vps "pm2 logs --err"'
alias status='ssh ora-vps "pm2 status && echo && curl -s https://api.orashop.in/api/health | jq ."'
alias restart='ssh ora-vps "pm2 restart all"'
alias mem='ssh ora-vps "ps aux | grep ora-backend | grep -v grep | awk '\''{print \$6}'\'' | sort -n"'
alias rollback='ssh ora-vps "cd /home/deploy/oranew && git revert HEAD --no-edit && cd /var/www/ora-backend/backend && npm run build && pm2 reload all"'
EOF
source ~/.bashrc
```

### Command Summary Table

| Task | Command |
|---|---|
| **Deploy** | `cd ~/Downloads/oranew && git push origin main && ssh ora-vps "cd /home/deploy/oranew && git pull && cd /var/www/ora-backend/backend && cp -r /home/deploy/oranew/backend/src . && npm run build && pm2 reload all"` |
| **View Logs** | `ssh ora-vps "pm2 logs"` |
| **View Errors** | `ssh ora-vps "pm2 logs --err --lines 50 --nostream"` |
| **Check Status** | `ssh ora-vps "pm2 status"` |
| **Health Check** | `curl -s https://api.orashop.in/api/health \| jq .` |
| **Restart Apps** | `ssh ora-vps "pm2 restart all"` |
| **Reload (Zero-Down)** | `ssh ora-vps "pm2 reload all"` |
| **View Memory** | `ssh ora-vps "ps aux \| grep ora-backend \| grep -v grep"` |
| **Rollback** | `ssh ora-vps "cd /home/deploy/oranew && git revert HEAD --no-edit && cd /var/www/ora-backend/backend && npm run build && pm2 reload all"` |
| **SSH to VPS** | `ssh ora-vps` |
| **View Raw Logs** | `ssh ora-vps "tail -100 /var/log/pm2/ora-backend-out.log"` |
| **Redis Health** | `ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 ping"` |

---

## Part 6: CI/CD Automation (Optional)

### GitHub Actions Auto-Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to VPS
        env:
          VPS_HOST: ${{ secrets.VPS_HOST }}
          VPS_USER: deploy
          VPS_KEY: ${{ secrets.VPS_SSH_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$VPS_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST '
            cd /home/deploy/oranew && git pull origin main &&
            cd /var/www/ora-backend/backend &&
            cp -r /home/deploy/oranew/backend/src . &&
            npm run build &&
            pm2 reload all
          '
      
      - name: Verify Deployment
        run: |
          curl -f https://api.orashop.in/api/health || exit 1
```

**GitHub Secrets to set:**
- `VPS_HOST`: `76.13.247.61`
- `VPS_SSH_KEY`: Private key from `~/.ssh/ora_vps`

---

**Last Updated:** 24 Feb 2026  
**Next Review:** When deployment frequency increases (consider CI/CD setup)

