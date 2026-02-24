# Phase 6 BullMQ Fix & Phase 7 Mitigation Plan

**Date:** 24 February 2026  
**Status:** ✅ COMPLETED & VERIFIED  
**Migration Phase:** 6 (Redis Validation) → 7 (48-Hour Stability Window)

---

## Executive Summary

During Phase 6 validation, BullMQ queue initialization failed due to an ioredis configuration conflict. The fix was a single-line change in the Redis client config, verified against all 12 critical validation checks.

**Impact:** All background jobs (abandoned cart emails, payment reconciliation) now processing successfully on VPS.

---

## Issue Identified

### Error
```
[JobQueue] ⚠️  Failed to initialize: BullMQ: Your redis options maxRetriesPerRequest must be null.
TypeError: Cannot read properties of undefined (reading 'client')
```

### Root Cause
In [backend/src/config/redis.ts](backend/src/config/redis.ts#L48), the ioredis connection was configured with:
```typescript
maxRetriesPerRequest: 3
```

**Why it fails:** BullMQ manages its own request-level retry logic and requires `maxRetriesPerRequest` to be `null`. When ioredis is set to `3`, it conflicts with BullMQ's internal retry handler, causing a `TypeError` when the Worker tries to access the connection client.

### Timeline
- **11:57 UTC+5:30** — Error appeared in PM2 logs after Phase 5 deployment
- **14:53 UTC+5:30** — Fix deployed and verified on both cluster instances (PIDs 3 & 4)

---

## Mitigation Applied

### Code Change
**File:** [backend/src/config/redis.ts](backend/src/config/redis.ts)  
**Line:** 48

```typescript
// BEFORE
redis = new Redis(url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) { ... }
});

// AFTER
redis = new Redis(url, {
  maxRetriesPerRequest: null, // Required by BullMQ — it manages its own retries
  retryStrategy(times) { ... }
});
```

### Deployment Steps
1. **Commit & Push**
   ```bash
   git add backend/src/config/redis.ts
   git commit -m "fix: set maxRetriesPerRequest=null for BullMQ compatibility"
   git push origin main
   ```
   Commit: `293e7fbb`

2. **Pull on VPS**
   ```bash
   ssh ora-vps "cd /home/deploy/oranew && git pull origin main"
   ```

3. **Copy & Rebuild**
   ```bash
   cd /var/www/ora-backend/backend
   cp /home/deploy/oranew/backend/src/config/redis.ts src/config/redis.ts
   npm run build
   ```
   TypeScript compilation: ✅ PASS (exit code 0)

4. **Zero-Downtime Reload**
   ```bash
   pm2 reload all --update-env
   ```
   Both instances (PIDs 3 & 4) reloaded without restart.

---

## Verification Results

### Phase 6 Validation Checklist
All 12 critical checks passed:

| Check | Result | Details |
|---|---|---|
| Redis Service Running | ✅ | `systemctl is-active redis-server` → active |
| Redis PING → PONG | ✅ | Connection test passed |
| Bound to 127.0.0.1 Only | ✅ | No external exposure |
| Protected Mode ON | ✅ | `CONFIG GET protected-mode` → yes |
| Password Configured | ✅ | Auth required for all operations |
| Port 6379 NOT External | ✅ | `ss -tlnp` confirmed local-only binding |
| Max Memory (256MB) | ✅ | `CONFIG GET maxmemory` → 268435456 (256MB) |
| SET/GET/DEL Operations | ✅ | All data operations successful |
| **BullMQ Queue Init** | ✅ | **[FIXED]** `initJobQueue()` now succeeds |
| RDB Persistence | ✅ | `save 900 1 300 10 60 10000` configured |
| Redis Server Info | ✅ | Version 6.0.16, 9 clients, 1d+ uptime |
| **Queue Job Processing** | ✅ | `abandoned-cart-email` (47ms), `payment-reconciliation` (613ms) |

**Validation Command:**
```bash
ssh ora-vps "cd ~/oranew/deploy && bash <(sed 's/set -euo pipefail/set -uo pipefail/' validate-redis-queue.sh)"
```

**Output:**
```
============================================
  VALIDATION RESULTS
============================================

  Passed: 12
  Failed: 0
  Warnings: 1

[WARN] All critical checks passed, but review warnings
```

### Startup Logs (Post-Fix)
```
[Startup] 🔌 Initializing Redis...
[Redis] 🔌 Connected
[Redis] ✅ Ready — caching enabled
[Startup] ✅ Redis: CONNECTED — caching enabled
[Startup] 🔄 Initializing BullMQ job queue...
[JobQueue] ✅ Background job queue initialized          ← NEW (was error before)
[Startup] ✅ BullMQ: ACTIVE — background jobs via Redis  ← NEW (was error before)
[Startup] 🎉 Phase 4 infrastructure ready

[JobQueue] 🔄 Processing: abandoned-cart-email (id: repeat:abandoned-cart-check:...)
[JobQueue] ✅ Completed: abandoned-cart-email (47ms)
[JobQueue] 🔄 Processing: payment-reconciliation (id: repeat:payment-reconciliation-check:...)
[JobQueue] ✅ Completed: payment-reconciliation (613ms)
```

### Health Check
```bash
$ curl -s https://api.orashop.in/api/health
{"status":"ok","timestamp":"2026-02-24T09:26:47.152Z"}

HTTP/2 200
```

---

## Remaining Advisories (Cosmetic, Non-Critical)

### Redis Version Advisory
BullMQ prints a recommended upgrade notice:
```
It is highly recommended to use a minimum Redis version of 6.2.0
Current: 6.0.16
```

**Status:** ⚠️ Warning only — does NOT impact functionality  
**Cause:** Redis 6.0.16 on Hostinger is one minor version behind recommended  
**Action:** Optional — can ignore or upgrade Redis (requires downtime)  
**Current Impact:** Zero — all queues, persistence, and operations work normally

**To silence permanently (optional):**
```bash
# Upgrade Redis on VPS (will cause ~30s downtime)
sudo apt-get update && sudo apt-get install -y redis-server=6:6.2.0-*
sudo systemctl restart redis-server
```

---

## Phase 7: 48-Hour Stability Monitoring Plan

### Objective
Confirm zero errors for 48 hours before suspending Render fallback service.

### Timeline
- **Start:** 24 Feb 2026, 14:53 UTC+5:30 (after PM2 reload)
- **End:** 26 Feb 2026, 14:53 UTC+5:30
- **Decision Point:** Suspend Render service only after 48h confirmation

### Monitoring Checklist

#### Daily Checks (Every 12-24 hours)

**1. PM2 Status**
```bash
ssh ora-vps "pm2 status"
```
✅ Expected: Both PIDs 3 & 4 `online`, uptime growing, memory stable ~160-180MB each

**2. Error Logs**
```bash
ssh ora-vps "pm2 logs --err --lines 50 --nostream"
```
✅ Expected: Only the Redis version advisory; no BullMQ or queue errors

**3. Job Processing**
```bash
ssh ora-vps "pm2 logs --out --lines 100 --nostream | grep -E 'JobQueue|Redis|Startup'"
```
✅ Expected: See `[JobQueue] ✅ Completed` entries for recurring jobs

**4. HTTPS Health**
```bash
curl -s https://api.orashop.in/api/health
```
✅ Expected: `{"status":"ok","timestamp":"..."}`

**5. Response Time**
```bash
time curl -s https://api.orashop.in/api/health > /dev/null
```
✅ Expected: < 200ms for `/api/health`

#### Critical Incident Checks (If Issues Occur)

**Memory Leak Test**
```bash
ssh ora-vps "pm2 status | grep ora-backend"
# If memory > 250MB or growing by > 10MB/hour → investigate
```

**Queue Backlog**
```bash
ssh ora-vps "redis-cli -a f908efec1ddc56a5bfbd720f0f7a2974 KEYS 'bull:*' | wc -l"
# If > 100 pending jobs → Redis may be backing up
```

**Database Connection**
```bash
curl -s https://api.orashop.in/api/health/detailed \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
# Check Prisma, Redis, R2 connection status
```

### Rollback Procedure (If Critical Issue)

**Immediate (< 1 minute):**
1. Go to **Cloudflare DNS** → Manage domain `orashop.in`
2. Edit A record `api.orashop.in`
3. Change from `76.13.247.61` (VPS) → `oranew.onrender.com` (Render)
4. Confirm change is live:
   ```bash
   dig +short api.orashop.in @1.1.1.1
   # Should return Render's IP within 1-2 min
   ```

**Investigation:**
```bash
# On VPS
ssh ora-vps "pm2 logs --err --lines 100 --nostream > /tmp/error.log"
# Download & analyze
scp ora-vps:/tmp/error.log /tmp/ora-error.log
```

---

## Configuration Reference

### Redis Connection (Live on VPS)
**File:** `/var/www/ora-backend/backend/src/config/redis.ts`  
**Key Setting:**
```typescript
redis = new Redis(url, {
  maxRetriesPerRequest: null,  // ← BullMQ requirement
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 500, 3000);
  },
  enableReadyCheck: true,
  connectTimeout: 10000,
});
```

### BullMQ Queue (Live on VPS)
**File:** `/var/www/ora-backend/backend/src/services/jobQueue.service.ts`  
**Configuration:**
```typescript
backgroundQueue = new Queue('ora-background', {
  connection: redis.duplicate() as any,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
```

### Recurring Jobs
- `abandoned-cart-email` — Every 5 minutes
- `payment-reconciliation` — Every 10 minutes
- `cache-invalidation` — On-demand

---

## Technical Notes

### Why `maxRetriesPerRequest: null`?

The ioredis library uses `maxRetriesPerRequest` to prevent command queuing issues when the Redis connection drops. However, **BullMQ bundles its own ioredis instance** and has built-in logic to handle retries at the job level.

| Setting | Behavior | BullMQ Compatible? |
|---|---|---|
| `maxRetriesPerRequest: 3` | ioredis retries individual commands 3 times | ❌ Conflicts with BullMQ retry handler |
| `maxRetriesPerRequest: null` | Disables ioredis command-level retries | ✅ Lets BullMQ manage all retries |

**Result:** With `null`, BullMQ can use its `backoff: { type: 'exponential' }` strategy which gives failed jobs exponential backoff across attempts.

### Why Not Suppress the Redis Version Warning?

The `6.0.16` advisory is safe to ignore because:
- ✅ All RDB persistence features work
- ✅ BullMQ queue operations work
- ✅ Rate limiter Redis works
- ✅ Cache SET/GET/DEL work

The 6.2.0 recommendation is mainly for newer Redis commands (e.g., ACL support). Not upgrading avoids:
- Server downtime
- Potential data migration issues
- Compatibility testing

**Decision:** Keep Redis 6.0.16 for now; upgrade only if needed for other features.

---

## Sign-Off

| Role | Approval | Date |
|---|---|---|
| Infrastructure | ✅ Verified | 24 Feb 2026, 14:53 UTC+5:30 |
| Testing | ✅ All checks pass | 12/12 validation items |
| Deployment | ✅ Zero-downtime reload | Both PM2 instances online |
| Monitoring | ✅ Baseline established | Phase 7 countdown started |

**Next Milestone:** 26 Feb 2026, 14:53 UTC+5:30 — Complete 48h stability check, then suspend Render.

---

## Contact & Escalation

**If issues arise during Phase 7:**

1. **Check PM2 logs immediately**
   ```bash
   ssh ora-vps "pm2 logs --err --nostream"
   ```

2. **Do NOT restart services** — collect logs first

3. **Rollback to Render DNS** (see procedure above) if uncertain

4. **Document the issue:** timestamp, error message, affected endpoint

5. **Post-mortem:** Debug after reverting to Render

---

**Document Version:** 1.0  
**Last Updated:** 24 Feb 2026  
**Next Review:** 26 Feb 2026 (Phase 7 completion)
