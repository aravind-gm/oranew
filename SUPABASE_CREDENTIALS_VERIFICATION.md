# ✅ SUPABASE CREDENTIALS VERIFICATION CHECKLIST

## Your Project Details
- **Project ID:** `hgejomvgldqnqzkgffoi`
- **Region:** `ap-south-1` (Asia Pacific)
- **Database User:** `postgres`
- **Password:** Encoded as `G.M.aravind%402006` in URL
  - Real password: `G.M.aravind@2006` (with @ symbol)

---

## How to Verify Credentials in Supabase

### Step 1: Access Supabase Dashboard
1. Go to: https://app.supabase.com/
2. Select project: `hgejomvgldqnqzkgffoi`
3. Navigate to: **Settings** (bottom left) → **Database**

### Step 2: Verify Database Status
In the **Database** settings page, check:

**Status Indicators:**
- [ ] Database Status: Should show "Running" (green)
- [ ] Connection pooler: Should show status (usually "Healthy")
- [ ] Storage: Should be connected

**If status is RED or shows errors:**
- Database might be paused or offline
- Try restarting: Look for "Restart" button

### Step 3: Check Connection Strings

Look for the **"Connection string"** section:

**Connection Pooler (PgBouncer):**
```
Server=aws-1-ap-south-1.pooler.supabase.com
User=postgres.hgejomvgldqnqzkgffoi
Port=6543
Password=[Your Password]
```

**Direct Connection:**
```
Server=db.hgejomvgldqnqzkgffoi.supabase.co
User=postgres
Port=5432
Password=[Your Password]
```

✅ **These should match our .env file exactly!**

### Step 4: Verify Password

**To reset or view password:**
1. Settings → Database → Database password
2. You should see:
   - Current password field
   - "Reset password" button
3. If password changed recently, update backend/.env

**Expected Password:** `G.M.aravind@2006`
- When URL-encoded becomes: `G.M.aravind%402006`
- Where `@` symbol becomes `%40`

### Step 5: Check IP Allowlist

1. Go to: **Settings → Security → IP Whitelist**
2. Check if IP Whitelist is **Enabled**
3. If enabled:
   - Add: `0.0.0.0/0` (allows all IPs - for testing)
   - Or add Render's IP ranges
4. Click "Save"

**Finding Render's IP:**
- Render uses dynamic IPs
- Safest: Use `0.0.0.0/0` for testing, then lock it down

### Step 6: Check Connection Pool Settings

1. Go to: **Settings → Database → Connection pooler**
2. Verify:
   - [ ] Pooler is **Enabled**
   - [ ] Mode: Should be **"Transaction"** or **"Session"**
   - [ ] Max connections: Should be reasonable (20-100)
   - [ ] Min connections: Usually 0
3. If recently changed:
   - Toggle OFF → Wait 10 sec → Toggle ON
   - This reconnects the pool

---

## Quick Verification Command

If you have psql installed, test connection directly:

```bash
# Test pooler connection
psql 'postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'

# Or test direct connection
psql 'postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres'

# If connected, you'll see: postgres=>
# Type: \q to exit
```

---

## Troubleshooting Checklist

### If Database Shows "Paused"
```
✓ Free tier pauses after 1 week of inactivity
✓ Click "Resume" button
✓ Wait 2-3 minutes for startup
✓ Test connection again
```

### If Password is Incorrect
```
✓ Go to: Settings → Database → Database password
✓ Click "Reset password"
✓ Enter NEW password (remember to URL-encode special chars)
✓ Update backend/.env with new password
✓ Update Render environment with new password
✓ Redeploy backend
```

### If IP Whitelist Blocks Render
```
✓ Go to: Settings → Security → IP Whitelist
✓ Add: 0.0.0.0/0 (for testing)
✓ Save
✓ Test connection
✓ Once working, lock down IP ranges
```

### If Connection Pool is Stuck
```
✓ Settings → Database → Connection pooler
✓ Toggle OFF
✓ Wait 30 seconds
✓ Toggle ON
✓ Wait 1-2 minutes
✓ Test connection
```

---

## Expected Working State

When everything is configured correctly:

```
Supabase Dashboard shows:
- Database: "Running" ✅
- Connection pooler: Healthy ✅
- Storage: Connected ✅

Backend health check returns:
{
  "status": "healthy",
  "database": { "connected": true },
  "storage": { "configured": true }
}

API endpoints work:
- GET /api/categories → 200 OK ✅
- GET /api/products → 200 OK ✅
```

---

## Credentials Reference

**DO NOT SHARE THESE PUBLICLY**

| Item | Value | Where to find |
|------|-------|---|
| Project ID | `hgejomvgldqnqzkgffoi` | Supabase URL |
| User | `postgres` | Settings → Database |
| Password | `G.M.aravind@2006` | Settings → Database password |
| Pooler Host | `aws-1-ap-south-1.pooler.supabase.com` | Settings → Database → Connection string |
| Pooler Port | `6543` | Connection string |
| Direct Host | `db.hgejomvgldqnqzkgffoi.supabase.co` | Connection string |
| Direct Port | `5432` | Connection string |

---

**Last Updated:** 28 Jan 2026
