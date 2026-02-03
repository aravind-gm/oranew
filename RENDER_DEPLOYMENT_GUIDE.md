# RENDER DEPLOYMENT GUIDE - Production Auth + DB Stability

**Date:** February 3, 2026  
**Critical for:** Free-tier instances with PostgreSQL + Prisma

---

## WHAT'S THE PROBLEM?

Render free-tier PostgreSQL goes to sleep after 15 minutes of inactivity. When it wakes:

1. **Server boots FIRST** (immediately)
2. **Database wakes SECOND** (after 30-60 seconds)
3. **Prisma tries to connect** (before DB is ready) ❌
4. **Connection fails** → 500 error
5. **Retry logic fails** → No automatic reconnect
6. **User sees infinite error loop** 😞

---

## ROOT CAUSE: Current Setup is "Lazy" but Not "Smart"

### What's Broken:
```
Server starts → Accepts requests immediately
Request 1 → [ECONNREFUSED] → 500 error
Request 2 → [ECONNREFUSED] → 500 error (retry doesn't work because Prisma connection is still stale)
...
```

### What We Fixed:
```
Server starts → Warmup database (wait max 30 sec)
Request 1 → [CONNECTED] → 200 OK
Render kills server → Sleep (connection cleaned up)
Render wakes → Server starts → Warmup again
Request 1 → [CONNECTED] → 200 OK
```

---

## DEPLOYMENT STEPS

### STEP 1: Set Environment Variables in Render

Go to Dashboard → Your Backend Service → Environment

**Add these variables:**

```env
# Database (Render provides these)
DATABASE_URL=postgresql://user:pwd@app-db-pgbouncer.render.internal/db?schema=public
DIRECT_URL=postgresql://user:pwd@app-db.render.internal/db?schema=public

# These should already exist
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-here
NODE_ENV=production
PORT=10000
```

**How to get Render database URLs:**
1. Go to Databases in Render Dashboard
2. Click your PostgreSQL database
3. Copy "Postgres Connection String" → This is DIRECT_URL
4. Copy "PgBouncer Connection String" → This is DATABASE_URL

---

### STEP 2: Verify Prisma Schema

Check `/backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")        # Uses PgBouncer
  directUrl = env("DIRECT_URL")          # Uses direct connection for migrations
}
```

✅ This is already set in the codebase.

---

### STEP 3: Run Prisma Migration on Render

**Option A: Auto-migrations in build script (Recommended)**

Edit `backend/package.json`:

```json
{
  "scripts": {
    "build": "prisma migrate deploy && tsc",
    "start": "node dist/src/server.js"
  }
}
```

This runs migrations automatically during deployment.

**Option B: Manual migration**

SSH into Render service:
```bash
cd backend
npx prisma migrate deploy
```

---

### STEP 4: Deploy Backend

From your local machine:

```bash
cd /home/aravind/Downloads/oranew/backend

# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Push to Render
git add .
git commit -m "Fix: Auth + DB connection stability (Render deployment)"
git push origin main

# 4. Monitor deployment
# Go to Render Dashboard → Logs → Watch the build and startup
```

**Expected log output:**

```
╔════════════════════════════════════════╗
║   ORA Jewellery API Server Running    ║
║   own. radiate. adorn.                ║
╠════════════════════════════════════════╣
║   Port: 10000                          ║
║   Env:  production                     ║
║   Mode: AUTO-WARMUP on cold start      ║
╚════════════════════════════════════════╝

[Startup] 🔥 Warming up database connection...
[Startup] ✅ Database: READY
[Startup] ✅ Server ready for requests
```

---

### STEP 5: Deploy Frontend

```bash
cd /home/aravind/Downloads/oranew/frontend

# Update API URL to production backend
# In frontend/.env or .env.production:
NEXT_PUBLIC_API_URL=https://your-render-backend.onrender.com/api

# Deploy to Vercel
git add .
git commit -m "Fix: Improved OTP login retry logic + error handling"
git push origin main

# Vercel auto-deploys (check deploy log)
```

---

## POST-DEPLOYMENT VERIFICATION

### Check 1: Health Endpoint

```bash
# Public health check (no auth needed)
curl https://your-backend.onrender.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-02-03T10:30:45.123Z",
  "uptime": 245.5,
  "database": "connected",
  "version": "1.0.0"
}
```

### Check 2: Test OTP Login

1. Go to `https://your-frontend.vercel.app/auth/login`
2. Enter email → Send OTP
3. Check email for OTP
4. Enter OTP → Should login successfully ✅

**If login fails:**
- Check `/api/health` endpoint
- If `"database": "disconnected"`, cold start issue
- Wait 30 seconds and retry

### Check 3: Test Admin Login

```bash
curl -X POST https://your-backend.onrender.com/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin_password"
  }'

# Expected: 200 OK with JWT token
# Or: 401 "Invalid credentials" (if email/password wrong)
```

### Check 4: Simulate Cold Start

On Render Dashboard:
1. Go to your service
2. Click "Settings"
3. Scroll to "Dangerous Zone"
4. Click "Delete Web Service" (just the web service, NOT the database)
5. Render will auto-deploy from git
6. Watch logs for "Warming up database"
7. Once "READY", test login again

---

## TROUBLESHOOTING

### Problem: OTP Login Returns 503 (Service Unavailable)

**Cause:** Database not ready after cold start

**Solution:**
```bash
# 1. Check health endpoint
curl https://your-backend.onrender.com/api/health

# Response should show:
{
  "database": "connected"
}

# 2. If still "disconnected", wait 30 seconds and retry
# 3. Check backend logs for errors

# 4. If problem persists, restart the web service:
# - Go to Render Dashboard
# - Click your backend service
# - Click "Settings" → "Restart Web Service"
```

### Problem: "Can't reach database server" in logs

**Cause:** Cold start, DB is still booting

**Solution:** 
- This is expected on cold starts
- Wait 30 seconds
- Server will automatically retry with warmup logic
- No action needed - it will recover automatically

### Problem: Login works once, then fails

**Cause:** Connection pool exhaustion

**Solution:**
- Check if using PgBouncer URL for DATABASE_URL
- Verify `connection_limit=1` in connection string
- Verify `pool_mode=transaction`
- Restart web service if problem persists

### Problem: "P2022: column supabase_id does not exist"

**Cause:** Migration didn't run

**Solution:**
```bash
# SSH into Render service (via web terminal or SSH)
# Or trigger manual migration:

# 1. Go to Render Dashboard
# 2. Click your backend service
# 3. Click "Shell" tab
# 4. Run:
cd /app/backend  # (or wherever your app is)
npx prisma migrate deploy --skip-generate
```

---

## PERFORMANCE TUNING

### Keep Frontend Health Polling (Optional)

For better recovery, frontend can ping health endpoint every 5 minutes:

```typescript
// frontend/lib/api.ts
setInterval(async () => {
  try {
    await fetch('/api/health');
    // Health check passed, resume normal operations
  } catch (err) {
    // DB might be restarting, wait before retrying user requests
  }
}, 5 * 60 * 1000); // Every 5 minutes
```

This prevents frontend from retrying important operations while DB is down.

### Connection Pooling Best Practices

**Current setup is production-ready:**
- ✅ PgBouncer connection pooling enabled
- ✅ Lazy initialization (no connection until needed)
- ✅ Singleton pattern (one client per process)
- ✅ Auto-reconnect on error
- ✅ Exponential backoff retry (max 3 attempts)

**No additional tuning needed for free-tier**

---

## RENDER SERVICE CONFIGURATION

**Verify these settings in Render Dashboard:**

| Setting | Value | Why |
|---------|-------|-----|
| Build Command | `cd backend && npm install && npm run build` | Install + TypeScript compile |
| Start Command | `cd backend && npm start` | Run compiled JS |
| Environment | `Node` | Must be Node (not Python) |
| Instance Type | Free | (Can upgrade to standard later) |
| Region | Closest to users | Lower latency |
| Auto Deploy | Enabled | Redeploy on push to main |

---

## MONITORING & ALERTS

### Set Up Health Check in Render

Go to Service → Settings → Health Check:

```
Path: /api/health
Protocol: HTTP
Port: 10000 (or your PORT)
Check Interval: 5 minutes
Timeout: 30 seconds
```

This tells Render when your service is healthy. If health check fails 3 times, Render will restart the service.

---

## COMMON MISTAKES TO AVOID

❌ **Don't:**
- Use DATABASE_URL for migrations (will hit PgBouncer connection limit)
- Create multiple PrismaClient instances (exhausts connection pool)
- Retry every request blindly (will cascade failures)
- Set `connection_limit=100` (PgBouncer limits to 5 anyway)
- Ignore database warnings in logs (they indicate issues)

✅ **Do:**
- Use DIRECT_URL for migrations (`prisma migrate`)
- Use DATABASE_URL for runtime queries
- Classify errors (retryable vs permanent)
- Implement exponential backoff (not linear)
- Monitor logs for "connection" errors
- Test on Render free-tier before production

---

## ROLLBACK PLAN

If something breaks after deployment:

```bash
# 1. Identify the problem
# Check Render logs for errors

# 2. Rollback to previous version
git revert HEAD
git push origin main
# Render auto-deploys the previous version

# 3. Or manually rollback Prisma migration
cd backend
npx prisma migrate resolve --rolled-back <migration-name>
git push origin main
```

---

## NEXT STEPS

1. ✅ Deploy backend with new code
2. ✅ Run Prisma migration
3. ✅ Deploy frontend with updated OTP logic
4. ✅ Test OTP login on Render
5. ✅ Monitor logs for 24 hours
6. ✅ Test cold starts by restarting service
7. ✅ Enable health check monitoring

---

## SUPPORT

If issues persist after deployment:

1. **Check health endpoint:** `GET /api/health`
2. **Check detailed logs:** `GET /api/health/detailed` (requires auth)
3. **Check Render logs:** Full request/response logs
4. **Check database:** Can Render access Supabase database?
5. **Test locally first:** Run `npm run dev` locally to isolate issue

---

## FILE CHECKLIST

- ✅ `backend/prisma/schema.prisma` - Updated with PgBouncer config
- ✅ `backend/src/config/database.ts` - Singleton + warmup logic
- ✅ `backend/src/utils/retry.ts` - Reconnect + error classification
- ✅ `backend/src/controllers/auth.controller.ts` - OTP + admin login fixed
- ✅ `backend/src/controllers/health.controller.ts` - Health check endpoint
- ✅ `backend/src/routes/health.routes.ts` - Health routes
- ✅ `backend/src/server.ts` - Warmup on startup
- ✅ `backend/prisma/migrations/001_add_pgbouncer_support.sql` - Migration script
- ✅ `frontend/src/app/auth/login/page.tsx` - Retry logic + admin fix
- ✅ `PRODUCTION_AUTH_DB_FIX.md` - Root cause analysis
- ✅ `RENDER_DEPLOYMENT_GUIDE.md` - This file

All files have been updated and are ready for deployment! 🚀
