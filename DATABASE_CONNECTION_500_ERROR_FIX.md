# 🔴 DATABASE CONNECTION 500 ERROR - DIAGNOSIS & FIX

## ISSUE IDENTIFIED

**Error:** `GET /api/categories` and `GET /api/products` returning `500 (Internal Server Error)`

**Root Cause:** Backend cannot connect to Supabase PostgreSQL database
- **Error Message:** `Can't reach database server at 'aws-1-ap-south-1.pooler.supabase.com:6543'`
- **Health Status:** Database connection `failed`
- **Affected Endpoints:** All API endpoints that query the database

---

## CURRENT STATUS

### ✅ What's Working
- Backend server is running (Render deployment is active)
- Health check endpoint responds: `/health` returns `{"status":"ok"}`
- CORS is configured correctly
- Storage (Supabase) is configured and connected

### ❌ What's Broken
- Database connectivity has failed
- All endpoints depending on database queries return `500` error:
  - `GET /api/categories` → 500
  - `GET /api/products` → 500
  - Any other endpoint using `prisma.*` calls

### Test Results
```bash
# Health check (basic)
curl https://oranew-backend.onrender.com/health
# Response: {"status":"ok","timestamp":"2026-01-28T05:02:14.266Z"}

# Health check (detailed)
curl https://oranew-backend.onrender.com/health/detailed
# Response shows:
# "database":{"connected":false,"error":"Can't reach database server..."}

# Categories endpoint
curl https://oranew-backend.onrender.com/api/categories
# Error: Prisma error - Cannot connect to database
```

---

## STEP-BY-STEP DIAGNOSIS

### 1. Verify Supabase Database Status

**Check Supabase Dashboard:**
1. Go to: https://app.supabase.com/
2. Select project: `hgejomvgldqnqzkgffoi` (from DATABASE_URL)
3. Navigate to: **Settings → Database**
4. Check:
   - Database status (should be "Running")
   - Connection pooler status
   - Recent activity logs for errors

**Check Database Connection Pool:**
```
Supabase Dashboard → Settings → Database → Connection string
- Host: aws-1-ap-south-1.pooler.supabase.com
- Port: 6543
- Status: Should show "Healthy"
```

### 2. Check Backend Environment Variables

**Current Configuration (from backend/.env):**
```
DATABASE_URL="postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres"
```

**Verify these are correct:**
- Database credentials match Supabase project
- Password is correctly URL-encoded (✓ `%40` = `@`)
- Connection pooler is enabled (`pgbouncer=true`)

### 3. Check Network Connectivity

**Render → Supabase Connectivity:**
1. Supabase might have IP allowlist enabled
2. Render's IP addresses might be blocked
3. Check Supabase → Settings → Security → IP Whitelist

---

## SOLUTIONS (IN ORDER)

### **SOLUTION 1: Restart Supabase Database** (Most Likely Fix)

**If Supabase database server is temporarily down:**

1. Go to: https://app.supabase.com/
2. Navigate to: **Settings → Database**
3. Look for any alerts or error messages
4. If database is paused or stopped, click "Resume" or restart

**If using connection pooler:**
1. Go to: **Settings → Database → Connection pooler**
2. Toggle it off and back on
3. Wait 30-60 seconds for it to reconnect

### **SOLUTION 2: Check IP Allowlist**

**Verify Render IP is whitelisted in Supabase:**

1. Go to: https://app.supabase.com/
2. Navigate to: **Settings → Security → IP Whitelist**
3. Check if Render's IP range is allowed
4. If IP Whitelist is enabled and doesn't include Render:
   - Add Render's IP: `0.0.0.0/0` (allows all - not recommended for production)
   - Or get Render's actual IP range and add it

**Note:** This is a **production security issue** - don't use `0.0.0.0/0` in production!

### **SOLUTION 3: Update DATABASE_URL in Render Environment**

**Render environment variables might be out of sync:**

1. Go to: https://dashboard.render.com/
2. Find backend service: `oranew-backend`
3. Navigate to: **Settings → Environment**
4. Verify `DATABASE_URL` matches backend/.env exactly:
   ```
   DATABASE_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. If changed, save and redeploy

### **SOLUTION 4: Rebuild and Redeploy Backend**

**Force a fresh deployment:**

1. Go to: https://dashboard.render.com/
2. Find service: `oranew-backend`
3. Click: **Deployments → Manual Deploy** (or redeploy latest)
4. Wait for deployment to complete
5. Check health: `curl https://oranew-backend.onrender.com/health/detailed`

### **SOLUTION 5: Switch to Direct URL (Temporary Workaround)**

**If connection pooler is problematic:**

1. Update `DATABASE_URL` in Render to use `DIRECT_URL`:
   ```
   DATABASE_URL=postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres
   ```
2. Note: Remove `?pgbouncer=true` - this is direct connection, no pooler
3. Redeploy backend
4. **Warning:** Direct connections are slower, but can help diagnose pooler issues

---

## VERIFICATION STEPS

### After Applying Each Fix:

**1. Check Health Endpoint:**
```bash
curl https://oranew-backend.onrender.com/health/detailed
```
✅ **Success:** Database should show `"connected":true`

**2. Test Categories Endpoint:**
```bash
curl https://oranew-backend.onrender.com/api/categories
```
✅ **Success:** Should return JSON with categories array

**3. Test Products Endpoint:**
```bash
curl https://oranew-backend.onrender.com/api/products?page=1&limit=16
```
✅ **Success:** Should return JSON with products array

**4. Monitor Frontend:**
- Visit: https://orashop.in or https://orashop.vercel.app
- Check browser console: No more "500 Internal Server Error"
- Categories should load
- Products should load

---

## QUICK CHECKLIST

- [ ] Verify Supabase database is running (not paused)
- [ ] Check Supabase connection pooler health
- [ ] Verify IP allowlist includes Render (or is disabled)
- [ ] Confirm DATABASE_URL in Render environment is correct
- [ ] Redeploy backend service
- [ ] Verify health endpoint shows `"connected":true`
- [ ] Test `/api/categories` returns data
- [ ] Test `/api/products` returns data
- [ ] Frontend loads without console errors
- [ ] Clear frontend browser cache and reload

---

## COMMON MISTAKES TO AVOID

❌ **Don't:** Change DATABASE_URL without verifying credentials
❌ **Don't:** Use weak IP allowlist (`0.0.0.0/0`) in production
❌ **Don't:** Forget to URL-encode special characters in password
❌ **Don't:** Mix pooler URL with Direct URL settings
❌ **Don't:** Assume password from Supabase dashboard is the same as in DATABASE_URL

---

## NEXT STEPS

1. **Immediate:** Check Supabase dashboard status
2. **Quick Fix:** If pooler is the issue, toggle it off/on
3. **Verify:** Test health endpoint returns `"connected":true`
4. **Test:** Verify frontend loads categories and products
5. **Monitor:** Watch for any recurring connection issues

If issue persists after these steps, provide:
- Supabase project ID: `hgejomvgldqnqzkgffoi`
- Database region: `ap-south-1` (Mumbai/Bangalore)
- Render service logs for last 24 hours

---

## DATABASE CONFIGURATION

**Current Setup:**
- **Database Provider:** Supabase (PostgreSQL)
- **Project:** `hgejomvgldqnqzkgffoi`
- **Region:** `ap-south-1` (Asia Pacific - Mumbai)
- **Pooler Host:** `aws-1-ap-south-1.pooler.supabase.com`
- **Pooler Port:** `6543`
- **Direct Host:** `db.hgejomvgldqnqzkgffoi.supabase.co`
- **Direct Port:** `5432`

---

**Status:** 🔴 **CRITICAL** - Database unreachable  
**Priority:** **P0 - All features blocked**  
**Updated:** 28 Jan 2026
