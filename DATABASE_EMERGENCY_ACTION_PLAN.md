# 🆘 DATABASE CONNECTION FAILURE - ACTION PLAN

**Issue:** Backend cannot reach Supabase database at `aws-1-ap-south-1.pooler.supabase.com:6543`  
**Severity:** 🔴 CRITICAL - All API requests failing  
**Status:** 🚨 INVESTIGATING  
**Time to Fix:** 5-15 minutes  

---

## ⚡ IMMEDIATE ACTIONS (DO NOW)

### Step 1: Verify Supabase Status (30 seconds)

```bash
# Check if database is running:
1. Open: https://app.supabase.com/
2. Select your project (ora-jewellery or similar)
3. Check status indicator:
   - 🟢 RUNNING = Database is up
   - 🔴 PAUSED = Database is paused (need to resume)
   - 🟡 STARTING = Database is starting
```

**If Paused:**
```bash
Click "Resume" button → Wait 60 seconds → Backend should reconnect
```

**If Running:**
→ Continue to Step 2

---

### Step 2: Check Connection Pooler (1 minute)

```bash
# In Supabase Dashboard:
1. Go to: Settings → Database → Connection pooler
2. Verify Status: Should show "Enabled" or "Running"
3. If "Disabled", click Enable
4. If showing error, click "Restart" or toggle OFF/ON
```

**Status meanings:**
- ✅ Enabled/Running: Connection pooler is working
- ⚠️ Disabled: Need to enable
- 🔴 Error: Try restarting (OFF → Wait 10s → ON)

---

### Step 3: Redeploy Backend (2-3 minutes)

**Method A: Via Render Dashboard**
```
1. Go to: https://dashboard.render.com/
2. Select Service: "oranew-backend"
3. Click Button: "Manual Deploy" (or Redeploy)
4. Wait for deployment to complete (~3-5 minutes)
5. Check Status: Should show "Running ✓"
```

**Method B: Via Command Line**
```bash
cd backend
npm install
npm run build
npm run dev

# Wait for message: "Database connected" or "Listening on port 5000"
```

---

### Step 4: Verify Connectivity

```bash
# Test if database is back:
curl https://oranew-backend.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "database": {
    "connected": true
  }
}

# If still showing "connected": false → Try Step 5
```

---

### Step 5: Restart Connection Pooler (Hard Reset)

If Steps 1-4 didn't work:

```bash
# In Supabase Dashboard:
Settings → Database → Connection pooler
  ↓
Click the "⋯" (three dots) menu
  ↓
Select "Restart" or "Reset"
  ↓
Wait 2-3 minutes for restart
  ↓
Check backend health again
```

---

## 🔧 DETAILED DIAGNOSTICS

### Check Your Database URL

**In Supabase Dashboard:**
```
Settings → Database → Connection string
Mode: "Transaction" (for pooler)
Copy the entire URL
```

**Your current DATABASE_URL:**
```
postgresql://postgres.hgejomvgldqnqzkgffoi:***@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**What should be present:**
- ✅ `postgresql://` protocol
- ✅ `@aws-1-ap-south-1.pooler.supabase.com:6543` host:port
- ✅ `pgbouncer=true` parameter
- ✅ Credentials in format: `user:password@host`

---

### Check Backend Environment

**On Render Dashboard:**
```
oranew-backend → Settings → Environment
Make sure DATABASE_URL matches backend/.env exactly
```

If different:
```
1. Click "DATABASE_URL" variable
2. Update value to: postgresql://postgres.hgejomvgldqnqzkgffoi:***@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
3. Click "Save changes"
4. Trigger redeploy (Step 3)
```

---

## 📋 TROUBLESHOOTING FLOWCHART

```
Database unreachable?
    ↓
Is Supabase paused?
    ├─ YES → Resume database → Wait 60s
    └─ NO ↓
Connection pooler enabled?
    ├─ NO → Enable pooler → Redeploy
    └─ YES ↓
PgBouncer enabled?
    ├─ NO → Add pgbouncer=true → Redeploy
    └─ YES ↓
DATABASE_URL correct on Render?
    ├─ NO → Update env vars → Redeploy
    └─ YES ↓
Try hard reset:
    ├─ Restart pooler on Supabase
    ├─ Redeploy backend
    ├─ Clear Prisma cache
    └─ Wait 5 minutes
        ↓
Still failing?
    → Contact Supabase support
    → Check: https://status.supabase.com/
```

---

## 🔄 AUTOMATED RECONNECTION SCRIPT

```bash
# Run this to auto-fix:
cd /home/aravind/Downloads/oranew
bash db-reconnect.sh

# This will:
✓ Clear Prisma cache
✓ Kill old processes
✓ Regenerate Prisma client
✓ Test connection
✓ Restart backend
```

---

## 📊 STATUS INDICATORS

### Red Flags 🔴
- "Can't reach database server"
- "Connection pooler disabled"
- Database status shows "Paused"
- PORT 6543 not reachable

### Green Lights ✅
- Database status "Running"
- Connection pooler "Enabled"
- PgBouncer "true" in URL
- Port 6543 reachable
- Backend health shows "connected": true

---

## 💾 RECOVERY CHECKLIST

- [ ] Supabase database is **Running** (not Paused)
- [ ] Connection pooler is **Enabled** (Settings → Database)
- [ ] DATABASE_URL has **pgbouncer=true**
- [ ] Backend environment has **correct DATABASE_URL**
- [ ] Render backend **deployed/redeployed**
- [ ] Backend health shows **connected: true**
- [ ] API endpoints returning **data** (not errors)
- [ ] No **console errors** in backend logs

---

## 📞 ESCALATION CONTACTS

**If database is still down after 15 minutes:**

### Supabase Support
- Email: support@supabase.io
- Status: https://status.supabase.com/
- Help: https://supabase.com/docs/guides/cli

### Render Support  
- Email: support@render.com
- Dashboard: https://dashboard.render.com/
- Status: https://status.render.com/

---

## 🎯 EXPECTED TIMELINE

| Time | Action | Status |
|------|--------|--------|
| Now | Check Supabase | 🔍 Investigating |
| +1m | Check pooler | 🔍 Verifying |
| +2m | Redeploy | 🔄 Redeploying |
| +5m | Check health | 📊 Testing |
| +10m | Database online | ✅ Should be up |
| +15m | Full service restored | ✅ All working |

---

## 🎁 BONUS: PREVENT FUTURE OUTAGES

### 1. Auto-Reconnection (Already Implemented)
```
Backend has retry logic for database connections
- Automatic retries every 5-10 seconds
- Exponential backoff to avoid overwhelming database
```

### 2. Health Monitoring
```
Check backend health every 5 minutes:
curl https://oranew-backend.onrender.com/health
```

### 3. Alert System (Recommended)
```
Set up alerts via:
- Render: Notifications → Email alerts
- Supabase: Email alerts for database events
- Datadog/New Relic: Custom monitoring
```

---

## ✅ NEXT STEPS AFTER RECOVERY

1. **Verify all endpoints working:**
   ```bash
   curl https://oranew-backend.onrender.com/api/products
   curl https://oranew-backend.onrender.com/api/categories
   ```

2. **Check Cart & Checkout:**
   - Frontend cart page should load products
   - Checkout should fetch categories
   - All forms should submit successfully

3. **Monitor logs:**
   - Render Dashboard → Logs
   - Watch for any new connection errors

4. **Document the issue:**
   - Record what happened
   - Record the fix that worked
   - Plan prevention for next time

---

**Last Updated:** February 2, 2026  
**Status:** TROUBLESHOOTING IN PROGRESS 🔄  
**ETA to Fix:** 5-15 minutes ⏱️

---

**👉 START WITH STEP 1 ABOVE NOW! Database should be back online within 10 minutes.**
