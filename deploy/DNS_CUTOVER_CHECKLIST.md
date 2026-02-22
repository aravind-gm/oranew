# ============================================================================
# ORA JEWELLERY — DNS CUTOVER & GO-LIVE CHECKLIST (Phase 7)
# ============================================================================
#
# This is the FINAL phase. Do NOT proceed until Phases 1-6 pass all checks.
#
# Architecture:
#   Cloudflare DNS → VPS (Nginx → PM2 → Express:5000)
#   Supabase PostgreSQL (unchanged)
#   Cloudflare R2 Storage (unchanged)
#   Vercel Frontend (unchanged, calls api.orashop.in)
#
# Current:  api.orashop.in → Render
# Target:   api.orashop.in → Hostinger VPS IP
# ============================================================================

## Pre-Cutover Checklist

### ✅ Phase Verification (ALL must pass)

- [ ] Phase 1: VPS hardened (SSH keys only, UFW active, Fail2ban running)
- [ ] Phase 2: Node 20 + PM2 + Nginx + Redis installed
- [ ] Phase 3: Code deployed, built, migrations applied, .env configured
- [ ] Phase 4: PM2 cluster running (2 instances), pm2 save done
- [ ] Phase 5: Nginx config installed, SSL cert issued
- [ ] Phase 6: Redis validation passed (all critical checks green)

### ✅ Direct IP Verification (Test VPS before DNS change)

Test the backend directly via VPS IP before touching DNS:

```bash
# Replace VPS_IP with your actual VPS IP address

# 1. Health check
curl -s http://VPS_IP:5000/api/health
# Expected: {"status":"ok",...}

# 2. Products endpoint
curl -s http://VPS_IP:5000/api/products?limit=1
# Expected: Product JSON

# 3. Categories
curl -s http://VPS_IP:5000/api/categories
# Expected: Categories array

# 4. Check PM2 instances
ssh deploy@VPS_IP "pm2 status"
# Expected: 2 instances, status "online"

# 5. Check Redis
ssh deploy@VPS_IP "redis-cli -a YOUR_REDIS_PASS ping"
# Expected: PONG

# 6. Check Nginx
ssh deploy@VPS_IP "sudo nginx -t"
# Expected: syntax ok, test successful

# 7. Check disk space
ssh deploy@VPS_IP "df -h /"
# Expected: < 80% usage

# 8. Check memory
ssh deploy@VPS_IP "free -h"
# Expected: Sufficient free memory
```

### ✅ Pre-Cutover Timing

- [ ] Choose low-traffic window (e.g., 2-4 AM IST)
- [ ] Notify team members
- [ ] Have Render dashboard open (for rollback)
- [ ] Have Cloudflare dashboard open
- [ ] Have SSH session ready to VPS
- [ ] Have this checklist open

---

## DNS Cutover Steps

### Step 1: Note Current DNS (for rollback)

```bash
# Record current DNS resolution
dig +short api.orashop.in
# Save this IP — it's the Render IP for rollback
```

### Step 2: Update Cloudflare DNS

1. Log in to Cloudflare dashboard
2. Select `orashop.in` domain
3. Go to **DNS** → **Records**
4. Find the A (or CNAME) record for `api`
5. Change it to:
   - **Type:** A
   - **Name:** api
   - **IPv4 address:** `YOUR_VPS_IP`
   - **Proxy status:** DNS only (gray cloud) — for initial testing
   - **TTL:** 1 minute (fastest propagation)
6. Click **Save**

> ⚠️ Start with "DNS only" (gray cloud) to test direct SSL from your VPS.
> After confirming everything works, you can optionally enable Cloudflare proxy.

### Step 3: Wait for Propagation

```bash
# Check propagation (repeat every 30 seconds)
dig +short api.orashop.in
# Should show YOUR_VPS_IP

# Or use multiple resolvers
dig @8.8.8.8 +short api.orashop.in
dig @1.1.1.1 +short api.orashop.in

# Global check
# Visit: https://dnschecker.org/#A/api.orashop.in
```

With 1-minute TTL, propagation should complete within 2-5 minutes.

### Step 4: Immediate Post-Cutover Tests

```bash
# 1. Basic health
curl -s https://api.orashop.in/api/health
# Expected: 200 OK with health info

# 2. SSL certificate check
echo | openssl s_client -servername api.orashop.in -connect api.orashop.in:443 2>/dev/null | openssl x509 -noout -subject -dates
# Expected: Valid cert for api.orashop.in

# 3. HTTP → HTTPS redirect
curl -s -o /dev/null -w "%{http_code}" http://api.orashop.in/api/health
# Expected: 301

# 4. Products load
curl -s https://api.orashop.in/api/products?limit=3 | jq '.products | length'
# Expected: 3

# 5. Categories load
curl -s https://api.orashop.in/api/categories | jq '. | length'
# Expected: > 0
```

### Step 5: Razorpay Webhook Test (CRITICAL)

```bash
# Check webhook endpoint responds
curl -s -X POST https://api.orashop.in/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -w "\nHTTP_CODE: %{http_code}\n"
# Expected: 400 or 401 (invalid signature) — NOT 502/503/timeout

# Monitor webhook logs
ssh deploy@VPS_IP "sudo tail -f /var/log/nginx/webhook.access.log"
```

> 🔴 If webhook returns 502/503/timeout, ROLLBACK IMMEDIATELY.
> Razorpay webhook failures = customers charged but orders not confirmed.

### Step 6: Frontend Integration Test

1. Open https://orashop.in in an incognito browser
2. Test the following flows:

- [ ] Homepage loads, products visible
- [ ] Product detail page loads with images
- [ ] Add to cart works
- [ ] Cart page shows correct items
- [ ] Login/Register works
- [ ] Profile page loads
- [ ] Guest checkout form works
- [ ] Razorpay payment modal opens (don't complete payment)
- [ ] COD option appears on checkout
- [ ] Admin panel loads (if applicable)

### Step 7: Background Jobs Verification

```bash
# SSH to VPS
ssh deploy@VPS_IP

# Check PM2 logs for scheduler activity
pm2 logs --lines 50 | grep -i "scheduler\|campaign\|inventory\|abandoned\|reconcil"

# Check BullMQ workers
pm2 logs --lines 50 | grep -i "bull\|queue\|worker\|job"

# Check for errors
pm2 logs --err --lines 20
```

---

## 48-Hour Monitoring Plan

### Hour 0-1: Active Monitoring

```bash
# Terminal 1: Live error log
ssh deploy@VPS_IP "pm2 logs --err"

# Terminal 2: Nginx errors
ssh deploy@VPS_IP "sudo tail -f /var/log/nginx/api.orashop.in.error.log"

# Terminal 3: Resource usage
ssh deploy@VPS_IP "watch -n 5 'pm2 status && echo --- && free -h && echo --- && df -h /'"
```

Check every 10 minutes:
- [ ] API health endpoint responding
- [ ] No 502/503 errors in Nginx log
- [ ] PM2 instances stable (no restarts)
- [ ] Memory usage stable (< 80%)
- [ ] No Sentry alerts

### Hour 1-6: Periodic Checks

Check every 30 minutes:
- [ ] `pm2 status` — all instances online
- [ ] No customer complaints
- [ ] Sentry error rate normal
- [ ] Payment webhooks processing (check recent orders in DB)

### Hour 6-24: Hourly Checks

- [ ] `pm2 monit` — memory/CPU trends
- [ ] Check Redis memory growth
- [ ] Verify scheduled jobs running (abandoned cart, reconciliation)
- [ ] Check disk usage

### Hour 24-48: Twice-daily Checks

- [ ] Morning: Full health check, review overnight logs
- [ ] Evening: Check payment processing, error rates
- [ ] Verify SSL cert auto-renewal timer is active

### Monitoring Commands Cheat Sheet

```bash
# PM2
pm2 status                     # Instance status
pm2 monit                      # Live CPU/memory dashboard
pm2 logs                       # Live logs
pm2 logs --err                 # Error logs only
pm2 restart all                # Restart (zero-downtime in cluster mode)

# Nginx
sudo tail -100 /var/log/nginx/api.orashop.in.access.log
sudo tail -100 /var/log/nginx/api.orashop.in.error.log
sudo tail -100 /var/log/nginx/webhook.access.log

# Redis
redis-cli -a YOUR_PASS INFO memory
redis-cli -a YOUR_PASS INFO clients
redis-cli -a YOUR_PASS DBSIZE

# System
htop                           # Live process monitor
free -h                        # Memory
df -h /                        # Disk
uptime                         # Load average
ss -tlnp                       # Open ports

# API Quick Tests
curl -s https://api.orashop.in/api/health | jq .
curl -s -o /dev/null -w "%{http_code}" https://api.orashop.in/api/products
```

---

## Rollback Procedure

If critical issues found within 48 hours:

### Quick Rollback (< 2 minutes)

1. **Go to Cloudflare Dashboard**
2. **DNS → Records → Edit `api` A record**
3. **Change IP back to Render's IP** (noted in Step 1)
4. **TTL: 1 minute**
5. **Save**

> Render service should still be running — do NOT shut it down during the 48h window.

### Verify Rollback

```bash
# Confirm DNS changed
dig +short api.orashop.in
# Should show Render IP

# Test API
curl -s https://api.orashop.in/api/health
# Should respond via Render
```

### Post-Rollback

- [ ] Investigate VPS issues
- [ ] Check Sentry for error details
- [ ] Review PM2 and Nginx logs on VPS
- [ ] Fix issues and retry cutover

---

## After 48-Hour Stability Window

Once the VPS has been stable for 48 hours:

### Step 1: Shut Down Render

1. Go to Render Dashboard
2. Select the ORA backend service
3. **Suspend** (not delete — keep for emergency)
4. After 7 days of VPS stability: **Delete** Render service

### Step 2: Optimize Cloudflare (Optional)

1. Enable Cloudflare Proxy (orange cloud) for api.orashop.in
2. Configure Cloudflare SSL mode to "Full (Strict)"
3. Enable Cloudflare caching rules for static API responses (if any)
4. Increase TTL to "Auto"

### Step 3: Set Up Server Monitoring

```bash
# Install basic monitoring (optional)
# Option A: Uptime monitoring
# Sign up for UptimeRobot (free) — monitor https://api.orashop.in/api/health

# Option B: Server metrics
# PM2 Plus (pm2.io) — free tier for basic metrics
pm2 link YOUR_SECRET YOUR_PUBLIC

# Option C: Cron-based health check
# Add to deploy user's crontab:
crontab -e
# Add:
*/5 * * * * curl -s -o /dev/null -w "%{http_code}" https://api.orashop.in/api/health | grep -q 200 || echo "API DOWN at $(date)" >> /var/log/api-health.log
```

### Step 4: Backup Strategy

```bash
# Weekly backup of configs (add to crontab)
0 3 * * 0 tar czf ~/backups/ora-config-$(date +\%Y\%m\%d).tar.gz /var/www/ora-backend/.env /etc/nginx/sites-available/ /etc/redis/ /var/www/ora-backend/ecosystem.config.js

# Keep last 4 backups
0 4 * * 0 find ~/backups/ -name "ora-config-*.tar.gz" -mtime +28 -delete
```

---

## Final Architecture Diagram

```
                    ┌─────────────────────┐
                    │    Cloudflare DNS    │
                    │  api.orashop.in      │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Hostinger VPS      │
                    │   Ubuntu 22.04       │
                    │                      │
                    │  ┌─────────────┐     │
                    │  │   Nginx     │     │   Port 80/443
                    │  │  + SSL      │     │
                    │  └──────┬──────┘     │
                    │         │            │
                    │  ┌──────▼──────┐     │
                    │  │    PM2      │     │   Port 5000
                    │  │  Cluster    │     │
                    │  │ ┌────┐┌────┐│     │
                    │  │ │Inst││Inst││     │
                    │  │ │ 0  ││ 1  ││     │
                    │  │ └────┘└────┘│     │
                    │  └──────┬──────┘     │
                    │         │            │
                    │  ┌──────▼──────┐     │
                    │  │   Redis     │     │   127.0.0.1:6379
                    │  │  (local)    │     │
                    │  └─────────────┘     │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  Supabase PostgreSQL │    Remote DB
                    │  (unchanged)         │
                    └─────────────────────┘
```

---

## Emergency Contacts & Resources

| Resource | URL / Command |
|----------|---------------|
| Cloudflare DNS | https://dash.cloudflare.com |
| Sentry Errors | https://sentry.io (check project) |
| Render (rollback) | https://dashboard.render.com |
| Supabase DB | https://supabase.com/dashboard |
| VPS SSH | `ssh deploy@YOUR_VPS_IP` |
| PM2 Status | `pm2 status` |
| Nginx Logs | `sudo tail -f /var/log/nginx/api.orashop.in.error.log` |
| Redis Check | `redis-cli -a PASS INFO memory` |
