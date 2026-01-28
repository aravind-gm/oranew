# 🚨 URGENT FIX: DATABASE UNREACHABLE

## Current Diagnosis
- ✅ DNS resolves `aws-1-ap-south-1.pooler.supabase.com` 
- ✅ Port 6543 is **reachable**
- ✅ PgBouncer is enabled in URL
- ❌ Database still returns "Can't reach database server"

**This suggests:** Supabase server is **offline or not responding** even though the port is open.

---

## IMMEDIATE WORKAROUND: Use Direct URL

**Switch DATABASE_URL from connection pooler to direct connection:**

### Option 1: Temporary Fix (Switch to Direct URL)

**In backend/.env**, change:
```
OLD:
DATABASE_URL="postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

NEW:
DATABASE_URL="postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres"
```

**Then in Render dashboard:**
1. Go to: https://dashboard.render.com/
2. Service: `oranew-backend`
3. Settings → Environment
4. Update `DATABASE_URL` with the direct URL above
5. Save and redeploy

**Benefits:**
- Bypasses the pooler entirely
- Connects directly to database (port 5432)
- Slower but more stable for immediate fix

---

## STEP-BY-STEP FIX

### Step 1: Update Render Environment
```
1. Go to https://dashboard.render.com/
2. Click: oranew-backend service
3. Settings → Environment Variables
4. Find: DATABASE_URL
5. Replace entire value with:
   postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
6. Click: Save
7. Wait for auto-redeploy (or Manual Deploy)
```

### Step 2: Verify Fix
```bash
# After 2-3 minutes, test:
curl https://oranew-backend.onrender.com/health/detailed

# Should show: "database":{"connected":true}
```

### Step 3: Test Endpoints
```bash
curl https://oranew-backend.onrender.com/api/categories
curl https://oranew-backend.onrender.com/api/products?page=1&limit=16
```

### Step 4: Verify Frontend
- Visit: https://orashop.vercel.app
- Check console: No 500 errors
- Categories should load
- Products should load

---

## Long-term Solution: Investigate Pooler

**After the above temporary fix works, investigate why pooler is down:**

1. Check Supabase Status Page: https://status.supabase.io/
2. Go to Supabase Dashboard: https://app.supabase.com/
3. Settings → Database → Connection pooler
4. Look for:
   - Status indicator (should be green)
   - Min/Max connections configured
   - Recent error logs
5. If pooler is stuck:
   - Toggle OFF, wait 10 sec, toggle ON
   - Or contact Supabase support

---

## Why This Happens

**Connection Pooler Issues:**
- Pooler can get stuck after many concurrent connections
- Database server restarts without pooler recovering
- Configuration limits reached
- Rare: Supabase platform issue

**Direct Connection:**
- More stable for production
- No pooler overhead
- But slightly slower (< 50ms difference)
- Good fallback mechanism

---

## Estimated Time to Fix
⏱️ **5-10 minutes**

1. Update Render env: 2 min
2. Redeploy: 2 min  
3. Verify: 2 min

---

## IF STILL NOT WORKING

After switching to direct URL, if still getting 500 errors:

1. Check Render logs: https://dashboard.render.com/
   - Service: oranew-backend
   - Logs tab → Last 100 lines
   - Look for any error messages

2. Check if database credentials are correct:
   - Supabase → Settings → Database
   - Verify password matches `G.M.aravind%402006`
   - ⚠️ Special character: `@` = `%40`

3. Check if database is paused:
   - Supabase → Project
   - If on free tier, database pauses after 1 week of inactivity
   - Click "Resume" button if paused

4. Check database size limits:
   - Supabase free tier: 500 MB
   - If exceeded, either upgrade or delete data

---

**Status:** 🟡 WORKAROUND AVAILABLE  
**Action:** Switch to direct URL  
**Priority:** HIGH  
**Updated:** 28 Jan 2026, 05:06 UTC
