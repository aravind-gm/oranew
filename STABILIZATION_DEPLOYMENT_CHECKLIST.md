# Stabilization Deployment Checklist

## Pre-Deployment Review

### Code Review Checklist
- [ ] Reviewed all file changes in `BEFORE_AFTER_CODE_CHANGES.md`
- [ ] Confirmed no schema changes (database schema unchanged)
- [ ] Confirmed no new dependencies added
- [ ] Confirmed no breaking changes to existing API
- [ ] Understood the rationale for each change

### Configuration Review
- [ ] Database password correctly set in `.env`
- [ ] DATABASE_URL has pooler: `pooler.supabase.com:6543?pgbouncer=true`
- [ ] DIRECT_URL has direct connection: `db.xxx.supabase.co:5432`
- [ ] No credentials accidentally committed to git

### Files Changed Summary
```
✅ backend/.env - Database URL configuration
✅ backend/src/config/database.ts - Prisma singleton + health/recovery
✅ backend/src/server.ts - /api/health endpoint + lazy startup
✅ backend/src/middleware/databaseRecovery.ts - NEW file (recovery logic)
✅ backend/src/middleware/errorHandler.ts - Error categorization
```

---

## Deployment Steps

### Step 1: Verify Local Build (5 minutes)

```bash
# Navigate to backend
cd backend

# Type check
npm run build

# Expected output:
# ✅ No TypeScript errors
# ✅ Clean compilation
```

**Checkpoint:** Build succeeds without errors

---

### Step 2: Commit & Push Code (5 minutes)

```bash
# Check what's changed
git status

# Stage code changes only
git add backend/src/
git add backend/.env

# Commit with meaningful message
git commit -m "Stabilize Prisma + Supabase: pooler config, recovery middleware, keep-alive

- Use PgBouncer pooler (port 6543) instead of direct connection
- Implement Prisma singleton with health checks and recovery
- Add /api/health keep-alive endpoint to prevent Render sleep
- Add automatic connection recovery with ONE retry
- Enhance error logging with diagnostic categories

Refs: STABILIZATION_COMPLETE_IMPLEMENTATION.md"

# Push to GitHub
git push origin main
```

**Checkpoint:** Code successfully pushed to GitHub

---

### Step 3: Update Render Environment Variables (5 minutes)

**Go to:** https://dashboard.render.com → Your Backend Service → Settings → Environment

**Set DATABASE_URL:**
```
postgresql://postgres.hgejomvgldqnqzkgffoi:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

⚠️ **Critical Checks:**
- [ ] Port is 6543 (NOT 5432)
- [ ] Hostname is `pooler.supabase.com` (NOT `db.xxx.supabase.co`)
- [ ] Contains `?pgbouncer=true` parameter
- [ ] Password is correct

---

### Step 4: Wait for Render Deployment (10 minutes)

**In Render logs, you should see:**
```
✅ Server ready
📌 Database connection: LAZY (connects on first request)
📌 Keep-alive endpoint: GET /api/health
📌 Recovery strategy: Auto-reconnect on connection error
```

**Checkpoint:** Render deployment succeeds

---

## Verification Tests

### Test 1: Health Endpoint
```bash
curl https://your-render-backend/api/health

# Expected response (200 status):
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Test 2: API Endpoints
```bash
# Test products endpoint
curl https://your-render-backend/api/products

# Expected: Returns products array (not "Can't reach database server")

# Test categories endpoint
curl https://your-render-backend/api/categories

# Expected: Returns categories array (not 500 error)
```

---

### Test 3: Check Logs (First Hour)

**✅ Good Signs:**
```
[INFO] Successfully fetched products
[INFO] Health check: OK
[WARNING] ⏱️  COLD START (occasionally, maybe once per hour)
```

**❌ Bad Signs:**
```
[Error] Can't reach database server
[CRITICAL] 🔥 POOL EXHAUSTION
[PrismaClientInitializationError]
```

---

## Success Criteria

### ✅ Deployment Success
- [ ] Code pushed to GitHub
- [ ] Render deployment succeeds
- [ ] Server starts with "✅ Server ready"

### ✅ Operational Success
- [ ] `/api/health` returns 200
- [ ] `/api/products` works
- [ ] `/api/categories` works
- [ ] No "Can't reach database server" errors

### ✅ Stability Success
- [ ] Cold starts don't cause errors
- [ ] No "Too many connections" errors
- [ ] No PrismaClientInitializationError
- [ ] API responds consistently

---

## Rollback Plan

### If Something Goes Wrong
```bash
# Revert the code changes
git revert HEAD --no-edit
git push

# Render will auto-deploy old version
# Expected: Service recovers within 2 minutes
```

---

## Timeline Estimate

- **Pre-Deployment Review:** 10 minutes
- **Code Commit & Push:** 5 minutes
- **Render Environment Update:** 5 minutes
- **Render Deployment:** 10 minutes
- **Verification Tests:** 10 minutes

**Total Time:** ~40 minutes to fully deployed and verified

---

## Documentation Package

You now have comprehensive documentation:

1. **STABILIZATION_COMPLETE_IMPLEMENTATION.md** - Full explanation
2. **STABILIZATION_QUICK_REFERENCE.md** - Quick summary
3. **BEFORE_AFTER_CODE_CHANGES.md** - Detailed code changes
4. **This file** - Deployment checklist

---

## Success Message

When you see this in Render logs, stabilization is working:

```
╔════════════════════════════════════════╗
║   ORA Jewellery API Server Running    ║
║   own. radiate. adorn.                ║
╚════════════════════════════════════════╝

[Startup] ✅ Server ready
[Startup] 📌 Database connection: LAZY (connects on first request)
[Startup] 📌 Keep-alive endpoint: GET /api/health
[Startup] 📌 Recovery strategy: Auto-reconnect on connection error
```

**You can deploy with confidence.** 🚀
