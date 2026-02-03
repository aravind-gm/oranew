# ENVIRONMENT FILES SUMMARY

## Files Created/Modified

### Backend Environment Files

#### 1. `backend/.env.development` ✅
**Purpose:** Local development with PostgreSQL

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ora_db"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/ora_db"
SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
JWT_SECRET="ora-jewellery-production-jwt-secret-key-2024-secure"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
RAZORPAY_KEY_ID="rzp_test_S3RpfRx3I2B7GC"
RAZORPAY_KEY_SECRET="2x7zVlpYrT6RA2xGQhhK27oe"
RAZORPAY_WEBHOOK_SECRET="test_webhook_secret_local_testing"
EMAIL_HOST="smtp.titan.email"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="admin@orashop.in"
EMAIL_PASS="ORAglobal"
EMAIL_FROM="ORA Jewellery <admin@orashop.in>"
FRONTEND_URL="http://localhost:3000"
PORT="5000"
```

**How to use:**
```bash
cd backend
cp .env.development .env
npm run dev
```

---

#### 2. `backend/.env.production` ✅
**Purpose:** Production deployment on Render

```env
DATABASE_URL="postgresql://user:pwd@pgbouncer.render.internal:6543/db?schema=public&connection_limit=1&pool_mode=transaction"
DIRECT_URL="postgresql://user:pwd@direct.render.internal:5432/db?schema=public"
SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
JWT_SECRET="your-production-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
RAZORPAY_KEY_ID="rzp_live_your_key"
RAZORPAY_KEY_SECRET="your_secret_key"
RAZORPAY_WEBHOOK_SECRET="webhook_secret"
EMAIL_HOST="smtp.titan.email"
EMAIL_PORT="587"
EMAIL_USER="noreply@yourdomain.com"
EMAIL_PASS="your-email-password"
EMAIL_FROM="ORA Jewellery <noreply@yourdomain.com>"
FRONTEND_URL="https://your-frontend.vercel.app"
PORT="10000"
APP_VERSION="1.0.0"
```

**How to use:**
1. **DO NOT** use local `.env` file
2. Set variables in **Render Dashboard → Environment**
3. Copy values from `backend/.env.production` template

---

### Frontend Environment Files

#### 3. `frontend/.env.development` ✅
**Purpose:** Local development

```env
NEXT_PUBLIC_SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_S3RpfRx3I2B7GC"
NODE_ENV="development"
```

**How to use:**
```bash
cd frontend
cp .env.development .env.local
npm run dev
```

---

#### 4. `frontend/.env.production` ✅
**Purpose:** Production deployment on Vercel

```env
NEXT_PUBLIC_SUPABASE_URL="https://hgejomvgldqnqzkgffoi.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_API_URL="https://your-backend.onrender.com/api"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_your_key"
NODE_ENV="production"
```

**How to use:**
1. Set in **Vercel Dashboard → Settings → Environment Variables**
2. Apply to: `Production` environment

---

## Environment Variables Reference

### CRITICAL FOR PRODUCTION FIX

| Variable | Backend | Frontend | Purpose | Production Value |
|----------|---------|----------|---------|------------------|
| `DATABASE_URL` | ✅ | ❌ | Pooled DB connection | PgBouncer endpoint |
| `DIRECT_URL` | ✅ | ❌ | Direct DB (migrations) | Direct connection |
| `NEXT_PUBLIC_API_URL` | ❌ | ✅ | Backend API endpoint | `https://your-backend.onrender.com/api` |
| `JWT_SECRET` | ✅ | ❌ | Session signing | 32+ random chars |
| `NODE_ENV` | ✅ | ✅ | Mode (dev/prod) | `production` |

### Supabase

| Variable | Backend | Frontend | Purpose |
|----------|---------|----------|---------|
| `SUPABASE_URL` | ✅ | ✅ (NEXT_PUBLIC_) | API endpoint |
| `SUPABASE_ANON_KEY` | ✅ | ✅ (NEXT_PUBLIC_) | Public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ❌ | Secret (backend only) |

### Payment Gateway

| Variable | Backend | Frontend | Purpose | Example |
|----------|---------|----------|---------|---------|
| `RAZORPAY_KEY_ID` | ✅ | ✅ (NEXT_PUBLIC_) | Public key | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | ✅ | ❌ | Secret (backend only) | Keep secret |
| `RAZORPAY_WEBHOOK_SECRET` | ✅ | ❌ | Webhook verification | Keep secret |

### Email

| Variable | Backend | Frontend | Purpose |
|----------|---------|----------|---------|
| `EMAIL_HOST` | ✅ | ❌ | SMTP server |
| `EMAIL_PORT` | ✅ | ❌ | SMTP port (usually 587) |
| `EMAIL_USER` | ✅ | ❌ | Email username |
| `EMAIL_PASS` | ✅ | ❌ | Email password |
| `EMAIL_FROM` | ✅ | ❌ | Sender address |

### URLs

| Variable | Backend | Frontend | Example Dev | Example Prod |
|----------|---------|----------|-------------|--------------|
| `FRONTEND_URL` | ✅ | ❌ | `http://localhost:3000` | `https://your-frontend.vercel.app` |
| `NEXT_PUBLIC_API_URL` | ❌ | ✅ | `http://localhost:5000/api` | `https://your-backend.onrender.com/api` |

---

## Step-by-Step Setup

### For Local Development

```bash
# 1. Backend setup
cd backend
cp .env.development .env
# Verify: DATABASE_URL points to localhost:5432

# 2. Frontend setup
cd frontend
cp .env.development .env.local
# Verify: NEXT_PUBLIC_API_URL points to localhost:5000

# 3. Start servers
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev

# 4. Test at http://localhost:3000
```

### For Production (Render + Vercel)

```bash
# 1. Backend - Set Render environment variables
# Go to: Render Dashboard → Your Service → Environment
# Add all variables from backend/.env.production
# CRITICAL: 
#   - DATABASE_URL must be PgBouncer endpoint
#   - DIRECT_URL must be direct endpoint
#   - Connection_limit=1 for stability

# 2. Frontend - Set Vercel environment variables
# Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
# Add variables from frontend/.env.production
# CRITICAL:
#   - NEXT_PUBLIC_API_URL must point to your Render backend

# 3. Deploy
git add .
git commit -m "Setup environment files"
git push origin main
# Render and Vercel auto-deploy from git

# 4. Monitor
# Render: Dashboard → Logs → [Startup] ✅ Database: READY
# Vercel: Dashboard → Deployments → Check for errors
```

---

## Getting Required Values

### Render Database URLs

1. Go to Render Dashboard
2. Click your PostgreSQL database
3. Find "Connections" section:
   - **"Postgres Connection String"** → Copy to `DIRECT_URL`
   - **"PgBouncer Connection String"** → Copy to `DATABASE_URL`

Example:
```
DIRECT_URL=postgresql://postgres.abc123xyz:Pxyz@db.abc123xyz.supabase.co:5432/postgres
DATABASE_URL=postgresql://postgres.abc123xyz:Pxyz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Supabase Keys

1. Go to Supabase Dashboard
2. Click your project
3. Settings → API
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **Anon public key** → `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY` (backend only!)

### Razorpay Keys

1. Go to Razorpay Dashboard
2. Settings → API Keys
3. Get:
   - **Key ID** → `RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`
4. For webhooks, go to: Settings → Webhooks
5. Get webhook secret → `RAZORPAY_WEBHOOK_SECRET`

---

## Verification Checklist

- [ ] `backend/.env.development` exists and has localhost URLs
- [ ] `backend/.env.production` exists (template only, don't commit)
- [ ] `frontend/.env.development` exists and has localhost URLs
- [ ] `frontend/.env.production` exists (template only, don't commit)
- [ ] All `.env*` files are in `.gitignore` ✅
- [ ] Render environment variables are set (Dashboard)
- [ ] Vercel environment variables are set (Dashboard)
- [ ] `NEXT_PUBLIC_API_URL` points to correct backend
- [ ] `DATABASE_URL` has `connection_limit=1`
- [ ] `JWT_SECRET` is 32+ characters
- [ ] No `.env` files will be committed to git

---

## Common Issues & Solutions

### "Failed to connect to database"
- Check `DATABASE_URL` format is correct
- Verify PostgreSQL is running (local dev)
- Verify Render database credentials (production)

### "API returns 401 Unauthorized"
- Check `NEXT_PUBLIC_API_URL` is correct
- Check `JWT_SECRET` is same in backend
- Check frontend is sending JWT token

### "Razorpay payment fails"
- Check using TEST keys in development (`rzp_test_`)
- Check using LIVE keys in production (`rzp_live_`)

### "Email not sending"
- Check `EMAIL_HOST` and `EMAIL_PORT`
- Check `EMAIL_USER` and `EMAIL_PASS`
- Check firewall allows SMTP (port 587)

---

**All environment files are ready!** Set them up and deploy. 🚀
