# 🔴 DATABASE CONNECTION ERROR - IMMEDIATE FIX

## Current Status
- ❌ Database: **UNREACHABLE**
- ✅ Connection pooler (port 6543): **REACHABLE**
- ✅ DNS: **RESOLVING**
- ⚠️ PgBouncer: **MIGHT BE DISABLED**

---

## 🚀 QUICK FIXES (Do these NOW)

### Option 1: Check Supabase Status (30 seconds)

1. **Open Supabase Dashboard:**
   ```
   https://app.supabase.com/
   → Select your project
   → Go to: Settings > Database > Health
   ```

2. **Verify database is RUNNING:**
   - If status shows "Paused", click "Resume"
   - Wait 30-60 seconds for database to start

3. **Check Connection Pooler:**
   - Go to: Settings > Database > Connection pooler
   - Verify it shows "Enabled"
   - If disabled, enable it

---

### Option 2: Restart Connection Pooler (1-2 minutes)

```bash
# In Supabase Dashboard:
1. Settings > Database > Connection pooler
2. Click "Restart" button
3. Wait for "Status: Running"
4. Backend should reconnect automatically
```

---

### Option 3: Redeploy Backend on Render (2-3 minutes)

```bash
# Via Terminal:
cd backend
npm install
npm run build

# Or manually in Render:
1. Go to https://dashboard.render.com/
2. Select "oranew-backend" service
3. Click "Manual Deploy" button
4. Wait for deployment to complete
```

---

### Option 4: Run Local Reconnection Script

```bash
# From project root:
bash db-reconnect.sh

# This will:
✓ Clear Prisma cache
✓ Regenerate Prisma client
✓ Test connection
✓ Restart backend
```

---

## 🔍 DIAGNOSTIC CHECKLIST

- [ ] Supabase database is "Running" (not Paused)
- [ ] Connection pooler is "Enabled"
- [ ] PgBouncer is set to "true" in DATABASE_URL
- [ ] DATABASE_URL matches: `aws-1-ap-south-1.pooler.supabase.com:6543`
- [ ] Port 6543 is reachable (✅ confirmed)
- [ ] Render backend environment has correct DATABASE_URL
- [ ] No IP whitelist restrictions on Supabase

---

## 🛠️ MANUAL DATABASE URL FIX

If database URL is wrong in backend/.env:

```bash
# Your current URL (appears correct):
postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Components:
- User: postgres.hgejomvgldqnqzkgffoi  ✓
- Host: aws-1-ap-south-1.pooler.supabase.com  ✓
- Port: 6543  ✓
- pgbouncer: true  ✓
```

If you need to update it:
```bash
# Edit backend/.env
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
```

---

## ⚠️ IF STILL NOT WORKING

### Check Backend Logs:
```bash
# SSH into Render
# Or check Render dashboard logs:
https://dashboard.render.com/ → oranew-backend → Logs

# Look for:
- "Database connected" ✓ Good
- "Can't reach database server" ✗ Bad
```

### Check Supabase Logs:
```
Supabase Dashboard → Logs → Postgres Logs
Look for connection errors or authentication failures
```

### Test Connection Directly:
```bash
# From backend directory:
npx prisma db execute --stdin
SELECT 1;
EOF

# Should return: 1
```

---

## 📞 ESCALATION

If none of these work:

1. **Check Supabase Status Page:**
   ```
   https://status.supabase.com/
   ```

2. **Verify Credentials:**
   - Go to Supabase Dashboard
   - Copy exact DATABASE_URL from:
     Settings > Database > Connection string > URImode: "Transaction"
   - Paste into backend/.env

3. **Reset Connection:**
   ```bash
   # In Supabase Dashboard:
   Settings > Database > Connection pooler
   → Click "⋯" menu
   → Click "Reset"
   → Wait 2 minutes
   ```

4. **Contact Support:**
   - Supabase: support@supabase.io
   - Render: support@render.com

---

## ✅ VERIFICATION

When connection is restored, you should see:

```
✅ Backend logs show:
"Database connected: true"
"Prisma: Successfully migrated"

✅ API responds:
GET /api/products → Returns product list (not error)
GET /api/categories → Returns categories (not error)
GET /health → Shows "database": {"connected": true}
```

---

**Next Steps:**
1. Run ONE of the quick fixes above
2. Wait 2-3 minutes for reconnection
3. Check backend logs or health endpoint
4. If still down after 10 minutes, escalate

🚀 Database should be back online within 5-10 minutes!
