# 🔴 DATABASE CREDENTIALS ERROR - QUICK FIX

**Error:** `FATAL: Tenant or user not found`

This means your DATABASE_URL in Render has incorrect credentials.

---

## ✅ Quick Fix (5 minutes)

### 1. Get Correct URL from Supabase

Go to: https://app.supabase.com → Your Project → **Settings** → **Database**

Copy the **PgBouncer Connection String** (looks like):
```
postgresql://postgres.AbCdEfGhIj:aBcDeFgHiJkLmNoPqRsT@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Important:** Copy the WHOLE string, including the password!

---

### 2. Update Render Environment

Go to: https://dashboard.render.com → Your Backend Service → **Environment**

Find `DATABASE_URL` and click the pencil icon to edit.

**Clear the entire field** and paste this (replace XXXXX with credentials from step 1):
```
postgresql://postgres.XXXXX:YYYY@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true&sslmode=require&connect_timeout=10&statement_timeout=30000
```

Where:
- `XXXXX` = Your Supabase Project ID (from the URL)
- `YYYY` = Your Supabase Database Password (after the `:`)

Click **Save Changes** ✓

---

### 3. Also Update DIRECT_URL

Still in Render Environment, find `DIRECT_URL`.

From Supabase, the direct connection (not PgBouncer) looks like:
```
postgresql://postgres.AbCdEfGhIj:aBcDeFgHiJkLmNoPqRsT@db.PROJECTID.supabase.co:5432/postgres
```

Update in Render to:
```
postgresql://postgres.XXXXX:YYYY@db.XXXXX.supabase.co:5432/postgres?schema=public&sslmode=require&connect_timeout=10&statement_timeout=30000
```

Click **Save Changes** ✓

---

### 4. Redeploy

In Render Dashboard, click **Deploy** button to restart with new credentials.

---

## ✅ Verification

Watch the logs. You should see:

```
✅ [DB Warmup] ✅ Database ready in 2933ms
✅ [Startup] ✅ Database: READY
```

If you still see the error, double-check:
1. The credentials were copied completely (including password)
2. No spaces were added accidentally
3. The URL format matches the examples above
