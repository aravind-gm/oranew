# PHASE 2: BACKEND DEPLOYMENT - STEP-BY-STEP GUIDE
## Deploy Express.js Backend to Production

**Estimated Time:** 2-3 hours  
**Status:** Ready to Execute  
**Date:** January 25, 2026  
**Platforms:** Render.com (recommended), Railway, Vercel Functions  

---

## 📋 PRE-REQUISITES

Before starting Phase 2, confirm Phase 1 is complete:

- [ ] Supabase RLS policies enabled
- [ ] Storage bucket created  
- [ ] JWT_SECRET generated
- [ ] Supabase credentials copied
- [ ] backend/.env.production created

---

## 🎯 PHASE 2 OBJECTIVES

✅ Choose deployment platform  
✅ Connect GitHub repository  
✅ Configure build & start commands  
✅ Add production environment variables  
✅ Deploy backend API  
✅ Verify API endpoints responding  

---

## ⚙️ OPTION A: DEPLOY TO RENDER.COM (RECOMMENDED)

### Step 1: Create Render Account

```
1. Go to: https://render.com
2. Click "Sign Up"
3. Choose "GitHub" as sign-up method
4. Authorize Render to access your GitHub account
```

✅ **Verification:** Render account created

---

### Step 2: Connect GitHub Repository

```
1. In Render dashboard, click "Create +"
2. Select "Web Service"
3. Connect to repository: orashop-backend (or your repo name)
4. Click "Connect"
```

✅ **Verification:** Repository connected

---

### Step 3: Configure Build & Start Commands

```
Render Configuration:
├── Name: "orashop-api"
├── Environment: "Node"
├── Build Command: "npm install && npx prisma generate && npx prisma migrate deploy"
├── Start Command: "npm start"
├── Region: "Singapore" (closest to India)
└── Plan: "Starter" ($7/month) or "Standard" ($12/month)
```

**Fill in:**
- **Name:** orashop-api
- **Runtime:** Node 18+ (or latest)
- **Build Command:** 
  ```
  npm install && npx prisma generate && npx prisma migrate deploy
  ```
- **Start Command:** 
  ```
  npm start
  ```

✅ **Verification:** Build commands configured

---

### Step 4: Add Environment Variables

In Render dashboard, click "Advanced" or "Environment Variables" section:

```
DATABASE_URL = postgresql://postgres.hgejomvgldqnqzkgffoi:G.M.aravind%402006@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL = postgresql://postgres:G.M.aravind%402006@db.hgejomvgldqnqzkgffoi.supabase.co:5432/postgres

SUPABASE_URL = https://hgejomvgldqnqzkgffoi.supabase.co

SUPABASE_ANON_KEY = [paste from your .env]

SUPABASE_SERVICE_ROLE_KEY = [paste from your .env]

JWT_SECRET = [use strong secret, NOT from your .env!]

RAZORPAY_KEY_ID = rzp_live_[your_production_key]

RAZORPAY_KEY_SECRET = [your_production_secret]

RAZORPAY_WEBHOOK_SECRET = [your_webhook_secret]

NODE_ENV = production

PORT = 10000

FRONTEND_URL = https://orashop.com

ALLOWED_ORIGINS = https://orashop.com,https://www.orashop.com

EMAIL_HOST = smtp.titan.email
EMAIL_PORT = 587
EMAIL_USER = admin@orashop.in
EMAIL_PASS = [your_email_password]
EMAIL_FROM = ORA Jewellery <admin@orashop.in>
```

**Important:** Use PRODUCTION Razorpay keys (not test keys)

✅ **Verification:** All environment variables added

---

### Step 5: Deploy

```
1. Click "Create Web Service" button
2. Wait for build to complete (5-10 minutes)
3. You'll see: "Your service is live at: https://orashop-api.onrender.com"
```

**Monitor build progress:**
- ✅ "Building..." → downloading dependencies
- ✅ "Building..." → running migrations
- ✅ "Building..." → compiling TypeScript
- ✅ "Deployed!" → API is live

✅ **Verification:** Backend deployed to Render

---

### Step 6: Test API Endpoints

```bash
# Test health check
curl https://orashop-api.onrender.com/api/health

# Test get products
curl https://orashop-api.onrender.com/api/products

# Test get categories
curl https://orashop-api.onrender.com/api/categories
```

**Expected response:**
```json
{
  "products": [...],
  "total": 50,
  "page": 1
}
```

✅ **Verification:** API endpoints responding

---

### Step 7: Configure Custom Domain (Optional)

```
1. In Render, click your service name
2. Go to "Settings" tab
3. Click "Add Custom Domain"
4. Enter: api.orashop.com
5. Copy the CNAME value
6. Go to your domain provider (GoDaddy, Namecheap, etc.)
7. Add CNAME record: api.orashop.com → [render-cname-value]
```

**Wait 5-30 minutes for DNS to propagate**

✅ **Verification:** Custom domain configured

---

## ⚙️ OPTION B: DEPLOY TO RAILWAY.APP

### Step 1: Create Railway Account

```
1. Go to: https://railway.app
2. Click "Start Project"
3. Login with GitHub
4. Authorize Railway
```

✅ **Verification:** Railway account created

---

### Step 2: Create New Project

```
1. Click "+ New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository
4. Wait for it to be detected
```

✅ **Verification:** GitHub repo connected

---

### Step 3: Configure Node Service

```
Railway will auto-detect package.json. Configure:
├── PORT: 5000
├── NODE_ENV: production
└── Build Command: npm install
```

✅ **Verification:** Node service created

---

### Step 4: Add Environment Variables

Click "Variables" tab and add all variables from Option A, Step 4

✅ **Verification:** All environment variables added

---

### Step 5: Deploy

```
1. Railway auto-deploys on GitHub push
2. Monitor "Deployments" tab
3. Wait for green checkmark ✅
4. Copy deployment URL
```

✅ **Verification:** Backend deployed to Railway

---

## ⚙️ OPTION C: DEPLOY TO VERCEL FUNCTIONS

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

### Step 2: Create API Routes

Create: `api/health.js`
```javascript
export default (req, res) => {
  res.status(200).json({ status: 'OK' });
};
```

**Note:** Vercel Functions may require refactoring Express routes to serverless functions

✅ **Verification:** Vercel setup (more complex than other options)

---

## 🔗 CONNECTING BACKEND TO FRONTEND

Once backend is deployed, you have your API URL:

```
Render: https://orashop-api.onrender.com
Railway: https://[project]-prod.up.railway.app
Vercel: https://orashop-api.vercel.app
Custom: https://api.orashop.com
```

---

## ✅ PHASE 2 COMPLETION CHECKLIST

- [ ] Backend deployed to production platform
- [ ] API responding to requests
- [ ] GET /api/products returns products
- [ ] GET /api/categories returns categories
- [ ] Environment variables all added
- [ ] Database migrations applied successfully
- [ ] No build errors in deployment logs
- [ ] Custom domain configured (optional)
- [ ] API URL copied for Phase 3

**Phase 2 Status:** ✅ COMPLETE when all items are checked

---

## 🚨 TROUBLESHOOTING

### Issue: "Migrations failed" error

**Solution:**
```
Check DIRECT_URL is correct
Verify Supabase project ID matches
Run: npx prisma migrate deploy --skip-generate
```

### Issue: "Cannot connect to database"

**Solution:**
```
Check DATABASE_URL is correct
Verify pgbouncer=true in connection string
Test connection locally first:
  psql $DATABASE_URL
```

### Issue: "Module not found" error

**Solution:**
```
Verify package.json is in repo root
Check npm install runs successfully
Delete node_modules and package-lock.json, retry
```

### Issue: "PORT already in use"

**Solution:**
```
Render/Railway provide PORT automatically
Don't hardcode PORT to 5000
Use: process.env.PORT || 5000
```

---

## 📞 NEXT STEPS

Once Phase 2 is complete:

✅ **Next:** Move to [PHASE 3: Frontend Deployment Setup](./PHASE_3_FRONTEND_SETUP.md)

You'll have your backend API URL needed for Phase 3.

---

## 📝 COMPLETION SIGN-OFF

```
Phase 2: Backend Deployment - COMPLETE ✅

Platform: [Render/Railway/Vercel]
API URL: [your-api-url]
Deployed on: [Date]
Environment: Production
Status: Live ✓

Ready for Phase 3: Frontend Deployment
```

---

**Phase 2 Status:** ✅ READY TO EXECUTE

Start now with your chosen platform!
