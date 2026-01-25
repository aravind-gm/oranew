# 🚀 Complete Render Deployment Guide — ORA Jewellery

**Date:** January 25, 2026  
**Status:** ✅ Step-by-step instructions for full deployment

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Prepare GitHub Repository](#step-1-prepare-github-repository)
4. [Step 2: Deploy Backend on Render](#step-2-deploy-backend-on-render)
5. [Step 3: Deploy Webhook Service on Render](#step-3-deploy-webhook-service-on-render)
6. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
7. [Step 5: Database Migrations](#step-5-database-migrations)
8. [Step 6: Test Deployment](#step-6-test-deployment)
9. [Troubleshooting](#troubleshooting)

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         RENDER.COM                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────┐          │
│  │    Backend       │    │  Webhook Service     │          │
│  │  (Express API)   │    │  (Razorpay Handler)  │          │
│  │                  │    │                      │          │
│  │ your-api.render  │    │ webhook.onrender.com │          │
│  └────────┬─────────┘    └──────────┬───────────┘          │
│           │                         │                      │
└───────────┼─────────────────────────┼──────────────────────┘
            │                         │
       ┌────┴────┐             ┌──────┴──────┐
       │          │             │             │
       │          │             │             │
    SUPABASE   RAZORPAY    RAZORPAY      SEND
    DATABASE  PAYMENT       WEBHOOK      EMAILS
             GATEWAY       HANDLER
```

---

## ✅ Prerequisites

- GitHub account with your code pushed
- Render.com account (free tier available)
- Supabase database already set up
- All environment variables ready

---

## 📁 Understanding Your Root Directory

Your **root directory** is:
```
/home/aravind/Downloads/oranew/
```

This is what you'll push to GitHub. Inside it are:
- `backend/` — The Express API server (deployed to Render)
- `frontend/` — Next.js website (already on Vercel)
- `webhook-service/` — Razorpay webhook (deployed to Render)
- `package.json` — Root package file
- `.env` — Environment variables (DO NOT commit)
- `.gitignore` — Excludes `.env` from Git

**When connecting to GitHub on Render:**
- You connect to this **root repository** (containing all three folders)
- The build/start commands use `cd backend` or `cd webhook-service` to run specific services
- Render will check out the entire repository, then run your build commands

---

## Step 1: Prepare GitHub Repository

### 1.1 Push code to GitHub

```bash
cd /home/aravind/Downloads/oranew
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 1.2 Verify directory structure

```bash
# Backend structure
backend/
  ├── src/
  │   ├── server.ts
  │   └── routes/
  ├── prisma/
  │   ├── schema.prisma
  │   └── seed.ts
  ├── package.json
  ├── tsconfig.json
  └── .env (NOT committed - add via Render)

# Webhook service structure
webhook-service/
  ├── src/
  ├── package.json
  ├── tsconfig.json
  └── .env (NOT committed)
```

### 1.3 Ensure `.gitignore` excludes `.env`

```bash
# Check if .env is in .gitignore
grep ".env" .gitignore
# Should see: .env, .env.local, etc.
```

---

## Step 2: Deploy Backend on Render

### 2.1 Create Render Web Service for Backend

1. Go to **[render.com](https://render.com)** and sign in
2. Click **New** → **Web Service**
3. Select your GitHub repository (backend repo or root repo)
4. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Name** | `ora-backend` |
   | **Environment** | `Node` |
   | **Build Command** | `cd backend && npm install && npm run build && npx prisma generate` |
   | **Start Command** | `cd backend && npm start` |
   | **Plan** | `Starter` (free tier) |
   | **Region** | `Singapore` or closest to users |

5. Click **Create Web Service**

### 2.2 Note Your Backend URL

After deployment, Render will assign a URL like:
```
https://ora-backend.onrender.com
```

Save this URL — you'll need it for webhook configuration.

---

## Step 3: Deploy Webhook Service on Render

### 3.1 Create Render Web Service for Webhook

1. In Render dashboard, click **New** → **Web Service**
2. Select your webhook service GitHub repository
3. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Name** | `ora-webhook` |
   | **Environment** | `Node` |
   | **Build Command** | `cd webhook-service && npm install && npm run build` |
   | **Start Command** | `cd webhook-service && npm start` |
   | **Plan** | `Starter` (free tier) |
   | **Region** | Same as backend |

4. Click **Create Web Service**

### 3.2 Note Your Webhook URL

After deployment, Render will assign a URL like:
```
https://ora-webhook.onrender.com
```

Save this URL.

---

## Step 4: Configure Environment Variables

### 4.1 Backend Environment Variables

1. Go to **Render Dashboard** → **Your Backend Service** → **Settings**
2. Scroll to **Environment**
3. Click **Add Environment Variable** for each:

```env
# Database
DATABASE_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://hgejomvgldqnqzkgffoi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZWpvbXZnbGRxbnF6a2dmZm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQwNzcsImV4cCI6MjA4Mzk2MDA3N30.44RrVx8pIFcyG6wE_ngBNzSIdkH4Rg-_RomlVt_9XaI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnZWpvbXZnbGRxbnF6a2dmZm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODM4NDA3NywiZXhwIjoyMDgzOTYwMDc3fQ.HMc_SCmktGEUF7sDhbwSYJpAbakklXu7VHbwDIWqYa4

# JWT
JWT_SECRET=ora-jewellery-production-jwt-secret-key-2024-secure
JWT_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_S3RpfRx3I2B7GC
RAZORPAY_KEY_SECRET=2x7zVlpYrT6RA2xGQhhK27oe

# Email
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=admin@orashop.in
EMAIL_PASS=ORAglobal
EMAIL_FROM=ORA Jewellery <admin@orashop.in>

# Frontend
FRONTEND_URL=https://orashop.vercel.app

# Node
NODE_ENV=production
PORT=5000
```

### 4.2 Webhook Service Environment Variables

1. Go to **Render Dashboard** → **Your Webhook Service** → **Settings**
2. Add these environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Razorpay
RAZORPAY_KEY_ID=rzp_test_S3RpfRx3I2B7GC
RAZORPAY_KEY_SECRET=2x7zVlpYrT6RA2xGQhhK27oe
RAZORPAY_WEBHOOK_SECRET=test_webhook_secret_local_testing

# Backend API URL (for webhook to call backend)
BACKEND_URL=https://ora-backend.onrender.com

# Node
NODE_ENV=production
PORT=3001
```

---

## Step 5: Database Migrations

### 5.1 Run Migrations on Render

**Option A: Using Render Build Hooks (Recommended)**

1. Go to Backend Service → **Settings** → **Build Command**
2. Update to include migrations:

```bash
cd backend && npm install && npm run build && npx prisma migrate deploy && npx prisma generate
```

3. Save and redeploy

**Option B: Manual Migration (Terminal)**

```bash
# From local machine
cd /home/aravind/Downloads/oranew/backend
npx prisma migrate deploy --skip-generate

# Or push schema directly
npx prisma db push
```

### 5.2 Verify Database Setup

```bash
# Check if tables exist
psql postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres

# List tables
\dt

# Exit
\q
```

---

## Step 6: Test Deployment

### 6.1 Test Backend API

```bash
# Health check
curl https://ora-backend.onrender.com/api/health

# Expected response
{"status": "ok"}
```

### 6.2 Test Webhook Service

```bash
# Health check
curl https://ora-webhook.onrender.com/health

# Expected response
{"status": "ok"}
```

### 6.3 Test API Endpoints

```bash
# Create a test product (requires auth)
curl -X POST https://ora-backend.onrender.com/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":100}'

# Get all products
curl https://ora-backend.onrender.com/api/products
```

### 6.4 Test Payment Flow

1. Go to frontend: https://orashop.vercel.app
2. Add product to cart
3. Click checkout
4. Pay with Razorpay test card:
   - Card: `4111111111111111`
   - Expiry: `12/25`
   - CVV: `123`
5. Verify order created in database

---

## 🔗 Update External Services

### Register Webhook URL in Razorpay

1. Go to **[Razorpay Dashboard](https://dashboard.razorpay.com)**
2. **Settings** → **Webhooks**
3. Click **Add Webhook**
4. **URL:** `https://ora-webhook.onrender.com/webhook/razorpay`
5. **Secret:** `test_webhook_secret_local_testing` (match your env var)
6. **Events to listen:**
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
7. Click **Create Webhook**

---

## 🐛 Troubleshooting

### Issue: Build Fails — "Cannot find module"

**Solution:**
```bash
# Ensure package.json has all dependencies
cd backend
npm install
npm run build

# Check for missing packages
npm ls
```

### Issue: Prisma Generation Fails

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Commit and push to trigger rebuild
git add .
git commit -m "Fix Prisma schema"
git push origin main
```

### Issue: Database Connection Timeout

**Solution:**
1. Verify `DATABASE_URL` in Render environment variables
2. Check if Supabase database is online
3. Test locally:
   ```bash
   psql $DATABASE_URL
   \dt  # List tables
   ```

### Issue: 502 Bad Gateway

**Solution:**
1. Check logs: **Render Dashboard** → **Service** → **Logs**
2. Look for errors like:
   - Missing env variables
   - Port conflicts
   - Module not found
3. Fix and push to trigger redeploy:
   ```bash
   git push origin main
   ```

### Issue: Webhook Not Receiving Events

**Solution:**
1. Check webhook is registered in Razorpay
2. Check secret matches env variable
3. Look at webhook service logs
4. Test manually:
   ```bash
   curl -X POST https://ora-webhook.onrender.com/webhook/razorpay \
     -H "Content-Type: application/json" \
     -d '{"test":"data"}'
   ```

---

## 📊 Monitoring & Logging

### View Logs

1. **Backend Logs:**
   - Go to Render Dashboard → `ora-backend` → **Logs**
   - Check for errors in real-time

2. **Webhook Logs:**
   - Go to Render Dashboard → `ora-webhook` → **Logs**
   - Monitor incoming webhook events

### Set Up Alerts (Optional)

1. Render Dashboard → **Settings** → **Notifications**
2. Enable email alerts for build failures and crashes

---

## 🚀 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Render backend service created
- [ ] Render webhook service created
- [ ] All environment variables set (backend)
- [ ] All environment variables set (webhook)
- [ ] Database migrations run
- [ ] Health checks pass (`/health` endpoints)
- [ ] API endpoints responding
- [ ] Razorpay webhook registered
- [ ] Test payment flow works
- [ ] Logs show no errors

---

## 📞 Support URLs

| Service | URL |
|---------|-----|
| Backend API | https://ora-backend.onrender.com |
| Webhook Service | https://ora-webhook.onrender.com |
| Frontend | https://orashop.vercel.app |
| Database | Supabase (already running) |
| Admin Panel | https://orashop.vercel.app/admin |

---

## 🎯 Next Steps

1. ✅ Deploy backend on Render
2. ✅ Deploy webhook service on Render
3. ✅ Set all environment variables
4. ✅ Run database migrations
5. ✅ Test all endpoints
6. ✅ Register webhook in Razorpay
7. ✅ Test payment flow end-to-end
8. ✅ Monitor logs for issues

---

**Deployment Status:** Ready for Render ✅  
**Last Updated:** January 25, 2026
