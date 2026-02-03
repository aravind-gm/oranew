# ENVIRONMENT VARIABLES SETUP GUIDE

**Production Auth + DB Stability Fix**

---

## QUICK SUMMARY

### Environment Files Structure

```
/home/aravind/Downloads/oranew/
├── .env                          (Root - not used normally)
├── backend/
│   ├── .env                      (Current - will be overridden)
│   ├── .env.development          (NEW - Local dev)
│   └── .env.production           (NEW - Production on Render)
├── frontend/
│   ├── .env                      (Current - deprecated)
│   ├── .env.development          (NEW - Local dev)
│   └── .env.production           (NEW - Production on Vercel)
```

---

## LOCAL DEVELOPMENT SETUP

### Step 1: Backend Development

**File:** `backend/.env.development`

```bash
# Copy the template:
cp backend/.env.development backend/.env

# Or use these values:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ora_db"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ora_db"
SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
JWT_SECRET="ora-jewellery-production-jwt-secret-key-2024-secure"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
PORT="5000"
```

### Step 2: Frontend Development

**File:** `frontend/.env.development` or `frontend/.env.local`

```bash
# Copy the template:
cp frontend/.env.development frontend/.env.local

# Or use these values:
NEXT_PUBLIC_SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_S3RpfRx3I2B7GC"
NODE_ENV="development"
```

### Step 3: Start Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Access at: http://localhost:3000
```

---

## PRODUCTION DEPLOYMENT (RENDER + VERCEL)

### Step 1: Render Backend Environment Variables

Go to **Render Dashboard → Your Backend Service → Environment**

**Add these variables:**

```
DATABASE_URL=postgresql://user:password@app-db-pgbouncer.render.internal:6543/database?schema=public&connection_limit=1&pool_mode=transaction
DIRECT_URL=postgresql://user:password@app-db.render.internal:5432/database?schema=public

SUPABASE_URL=https://hgejomvgldqnqzkgffoi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

JWT_SECRET=ora-jewellery-production-jwt-secret-key-2024-secure
JWT_EXPIRES_IN=7d

NODE_ENV=production

RAZORPAY_KEY_ID=rzp_live_your_key_here
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=webhook_secret_here

EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-password
EMAIL_FROM=ORA Jewellery <noreply@yourdomain.com>

FRONTEND_URL=https://your-frontend.vercel.app

PORT=10000
APP_VERSION=1.0.0
```

**How to get Render Database URLs:**
1. Go to Render Dashboard → Databases
2. Click your PostgreSQL database
3. Copy **"Postgres Connection String"** → `DIRECT_URL`
4. Copy **"PgBouncer Connection String"** → `DATABASE_URL`

### Step 2: Vercel Frontend Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Add these variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://hgejomvgldqnqzkgffoi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_here
NODE_ENV=production
```

**CRITICAL:** Make sure `NEXT_PUBLIC_API_URL` points to your **Render backend URL**!

### Step 3: Deploy

```bash
# Backend - Render auto-deploys from git
git push origin main

# Frontend - Vercel auto-deploys from git
git push origin main

# Monitor logs
# Render: Dashboard → Logs
# Vercel: Dashboard → Deployments → Logs
```

---

## ENVIRONMENT VARIABLES EXPLAINED

### Database Configuration (CRITICAL)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Connection pooling (PgBouncer) | `postgresql://...pgbouncer...?connection_limit=1` |
| `DIRECT_URL` | Direct connection (migrations) | `postgresql://...direct...` |

**Why two URLs?**
- `DATABASE_URL`: Used for all queries (pooled, safe)
- `DIRECT_URL`: Used for migrations only (direct, fast)

### Supabase Configuration

| Variable | Purpose | Where to Get |
|----------|---------|--------------|
| `SUPABASE_URL` | API endpoint | Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | Client key (public) | Same place |
| `SUPABASE_SERVICE_ROLE_KEY` | Service key (secret) | Same place |

**IMPORTANT:** Keep `SUPABASE_SERVICE_ROLE_KEY` secret! Never expose in frontend.

### JWT Configuration (CRITICAL)

| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_SECRET` | Signs session tokens | Min 32 characters, random |
| `JWT_EXPIRES_IN` | Token expiry | `7d`, `24h`, etc. |

**WARNING:** If you change `JWT_SECRET`, all user sessions become invalid!

### API Endpoints

| Variable | Purpose | Local Dev | Production |
|----------|---------|-----------|------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000/api` | `https://your-backend.onrender.com/api` |
| `FRONTEND_URL` | Frontend URL (backend needs it) | `http://localhost:3000` | `https://your-frontend.vercel.app` |

### Razorpay Configuration

| Variable | Purpose | Type |
|----------|---------|------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Payment gateway key | Public (visible in browser) |
| `RAZORPAY_KEY_SECRET` | Payment gateway secret | Secret (backend only) |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification | Secret (backend only) |

**Use TEST keys for development, LIVE keys for production.**

---

## MIGRATION FROM OLD .env TO NEW STRUCTURE

### Current State
```
backend/.env          (Mix of dev + prod settings)
```

### New State
```
backend/.env.development    (Local dev)
backend/.env.production     (Render)
backend/.env               (Symlink or copy of .development)
```

### Migration Steps

```bash
# 1. Backup current .env
cp backend/.env backend/.env.backup

# 2. Use development template for local work
cp backend/.env.development backend/.env

# 3. For production, set Render environment variables (not files)
# Go to Render Dashboard → Environment Variables
# Add all production values there

# 4. Same for frontend
cp frontend/.env.development frontend/.env.local

# 5. Git ignore all .env files
# Already in .gitignore - don't commit!
```

---

## ENVIRONMENT-SPECIFIC VALUES

### Development (Local)
```
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/ora_db
NEXT_PUBLIC_API_URL=http://localhost:5000/api
RAZORPAY_KEY_ID=rzp_test_* (test keys)
EMAIL_HOST=localhost:1025 (or test service)
```

### Staging (Optional)
```
NODE_ENV=production
DATABASE_URL=postgresql://staging-db.onrender.com/...
NEXT_PUBLIC_API_URL=https://staging-backend.onrender.com/api
RAZORPAY_KEY_ID=rzp_test_* (test keys)
EMAIL_HOST=smtp.titan.email (real email)
```

### Production
```
NODE_ENV=production
DATABASE_URL=postgresql://production-db.onrender.com/...
NEXT_PUBLIC_API_URL=https://production-backend.onrender.com/api
RAZORPAY_KEY_ID=rzp_live_* (live keys)
EMAIL_HOST=smtp.titan.email (real email)
JWT_SECRET=different from dev!
```

---

## SECURITY BEST PRACTICES

### ✅ DO
- [ ] Keep `.env` files out of git (already ignored)
- [ ] Use strong `JWT_SECRET` (min 32 random characters)
- [ ] Use different secrets for dev vs production
- [ ] Rotate `JWT_SECRET` in production monthly
- [ ] Store production secrets in Render/Vercel (not local files)
- [ ] Use test Razorpay keys in dev
- [ ] Use live Razorpay keys only in production
- [ ] Never commit `.env` files to git

### ❌ DON'T
- [ ] Commit `.env` files to git
- [ ] Use same `JWT_SECRET` everywhere
- [ ] Expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- [ ] Use hardcoded passwords in code
- [ ] Share `.env` files in Slack/email
- [ ] Use weak JWT_SECRET
- [ ] Mix development and production secrets

---

## TROUBLESHOOTING

### "Can't read environment variable X"

**Solution:**
1. Check file exists: `ls -la backend/.env`
2. Check syntax: Variables must be `KEY=VALUE` (no spaces around `=`)
3. Restart dev server: `npm run dev`
4. Check NODE_ENV: `echo $NODE_ENV` (should be `development`)

### "Database connection failed"

**Solution:**
1. Check `DATABASE_URL` is correct
2. Verify PostgreSQL is running: `psql -U postgres -d ora_db -c "SELECT 1"`
3. Check username/password in URL
4. Check localhost vs remote URL

### "API calls return 401 Unauthorized"

**Solution:**
1. Check `JWT_SECRET` is set in backend
2. Check `NEXT_PUBLIC_API_URL` points to correct backend
3. Check frontend is sending JWT in auth header
4. Verify JWT_SECRET is same in all environments

### "Razorpay not working"

**Solution:**
1. Check you're using TEST keys in development
2. Check you're using LIVE keys in production
3. Verify key format (starts with `rzp_test_` or `rzp_live_`)

---

## CHECKLIST BEFORE DEPLOYMENT

- [ ] `backend/.env.development` created and tested locally
- [ ] `backend/.env.production` created with Render values
- [ ] `frontend/.env.development` created and tested locally
- [ ] `frontend/.env.production` created (optional, Vercel can override)
- [ ] All `.env` files are in `.gitignore`
- [ ] No `.env` files committed to git
- [ ] Render environment variables set for backend
- [ ] Vercel environment variables set for frontend
- [ ] `NEXT_PUBLIC_API_URL` points to correct backend
- [ ] Database URLs have `connection_limit=1` for pooling
- [ ] JWT_SECRET is same across all environments
- [ ] All sensitive keys (SECRET_ROLE_KEY, RAZORPAY_SECRET) are server-side only
- [ ] Public keys (ANON_KEY, RAZORPAY_KEY_ID) are safe in frontend

---

## FILES PROVIDED

✅ `backend/.env.development` - Local development template  
✅ `backend/.env.production` - Production (Render) template  
✅ `frontend/.env.development` - Local development template  
✅ `frontend/.env.production` - Production (Vercel) template  
✅ This guide - Environment setup instructions

---

**Ready to deploy!** 🚀
