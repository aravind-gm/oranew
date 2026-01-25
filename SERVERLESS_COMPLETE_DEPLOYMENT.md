# Complete Serverless Deployment Guide
## Vercel Backend (Functions) + Vercel Frontend + Supabase

---

## 🚀 DEPLOYMENT OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                   DEPLOYMENT ARCHITECTURE                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  FRONTEND (Next.js)                                      │
│  ├─ Deployed: Vercel                                     │
│  ├─ URL: https://orashop.com                             │
│  └─ Auto-deploys from GitHub main branch                 │
│                                                           │
│  BACKEND (Express → Vercel Functions)                    │
│  ├─ Deployed: Vercel Functions (Serverless)              │
│  ├─ URL: https://api.orashop.com                         │
│  └─ Auto-scales with traffic                             │
│                                                           │
│  DATABASE & STORAGE (Supabase)                           │
│  ├─ PostgreSQL: Managed by Supabase                      │
│  ├─ Storage: Supabase Storage (product-images bucket)    │
│  ├─ RLS: Row-Level Security policies                     │
│  └─ URL: https://[project].supabase.co                   │
│                                                           │
│  DNS ROUTING                                             │
│  ├─ orashop.com → Vercel (frontend)                      │
│  └─ api.orashop.com → Vercel (backend)                   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before you start, ensure you have:

- [ ] GitHub account with your repo pushed
- [ ] Vercel account (free tier is fine)
- [ ] Supabase account
- [ ] Custom domain (orashop.com)
- [ ] Domain registrar access (GoDaddy, Namecheap, etc)
- [ ] Frontend and backend code ready

**Estimated Time: 2-3 hours total**

---

## PHASE 1: SUPABASE SETUP (30 minutes)

### Step 1.1: Create Supabase Project

```bash
# 1. Go to: https://app.supabase.com
# 2. Click "New Project"
# 3. Fill in:
#    - Name: ora-jewellery-prod
#    - Database Password: [Generate strong password]
#    - Region: Asia Pacific (ap-south-1) - Mumbai
# 4. Click "Create new project"
# 5. Wait for project to initialize (5-10 minutes)
```

### Step 1.2: Get Supabase Credentials

Once project is created:

```bash
# In Supabase Dashboard:
# 1. Go to: Settings > API
# 2. Copy these values:

PROJECT_URL=https://[project-id].supabase.co
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Also go to: Settings > Database
# 4. Copy:

DATABASE_URL=postgresql://postgres.[project-id]:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:PASSWORD@db.[project-id].supabase.co:5432/postgres
```

### Step 1.3: Enable RLS (Security) - CRITICAL

```bash
# 1. In Supabase Dashboard, go to: SQL Editor
# 2. Click "New Query"
# 3. Paste this SQL:

-- PRODUCTS TABLE - Public read only
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active" ON products
FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all" ON products
FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- PRODUCT_IMAGES TABLE - Public read only
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON product_images
FOR SELECT USING (true);
CREATE POLICY "admin_write" ON product_images
FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- CATEGORIES TABLE - Public read only
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active" ON categories
FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all" ON categories
FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

# 4. Click "Run"
# 5. Verify: All tables should show RLS enabled ✅
```

### Step 1.4: Create Storage Bucket

```bash
# 1. In Supabase Dashboard, go to: Storage
# 2. Click "Create new bucket"
# 3. Name: product-images
# 4. Select: Public (anyone can read)
# 5. Click "Create bucket"

# Verify bucket is created ✅
```

---

## PHASE 2: BACKEND DEPLOYMENT (45 minutes)

### Step 2.1: Prepare Backend for Vercel

In your `backend/` directory:

```bash
cd /home/aravind/Downloads/oranew/backend

# 1. Create vercel.json
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.ts",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb",
        "nodeVersion": "20.x"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url",
    "DIRECT_URL": "@direct_url",
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "JWT_SECRET": "@jwt_secret",
    "JWT_EXPIRES_IN": "7d",
    "RAZORPAY_KEY_ID": "@razorpay_key_id",
    "RAZORPAY_KEY_SECRET": "@razorpay_key_secret",
    "RAZORPAY_WEBHOOK_SECRET": "@razorpay_webhook_secret",
    "FRONTEND_URL": "@frontend_url",
    "PORT": "3001"
  }
}
EOF

# 2. Create .vercelignore
cat > .vercelignore << 'EOF'
node_modules
.git
.env.local
*.log
dist
.next
EOF

# 3. Update src/server.ts to support Vercel
```

### Step 2.2: Update server.ts for Vercel

Edit `backend/src/server.ts`:

```typescript
// At the TOP of the file, add:
import app from './server';  // Your express app

// At the BOTTOM, add this serverless export:
export default app;

// Keep your existing code:
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
```

### Step 2.3: Connect Backend to Vercel

```bash
# 1. Make sure you're in backend directory
cd /home/aravind/Downloads/oranew/backend

# 2. Install Vercel CLI globally (if not already)
npm install -g vercel

# 3. Login to Vercel
vercel login
# Follow browser prompts to authenticate

# 4. Link project
vercel link
# When asked:
# - Set up and deploy? → Yes
# - Project name → ora-backend-api
# - Root directory → .
# - Override settings? → No
```

### Step 2.4: Add Backend Environment Variables to Vercel

```bash
# 1. Go to Vercel Dashboard: https://vercel.com/dashboard
# 2. Select "ora-backend-api" project
# 3. Go to Settings > Environment Variables
# 4. Add these variables (get values from Supabase):

DATABASE_URL=postgresql://postgres.[project-id]:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:PASSWORD@db.[project-id].supabase.co:5432/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=[Generate: openssl rand -base64 32]
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_live_[your_key]
RAZORPAY_KEY_SECRET=[your_secret]
RAZORPAY_WEBHOOK_SECRET=[your_webhook_secret]
FRONTEND_URL=https://orashop.com
NODE_ENV=production

# 5. For each variable, set environment to:
#    - Production (for production deployment)
```

### Step 2.5: Deploy Backend

```bash
# Still in backend directory
cd /home/aravind/Downloads/oranew/backend

# Deploy to production
vercel --prod

# Wait for deployment to complete
# You'll see: ✓ Production: https://ora-backend-api.vercel.app

# Note: You can add custom domain later
```

### Step 2.6: Verify Backend Deployment

```bash
# Test your backend is running
curl https://ora-backend-api.vercel.app/api/health
# Should return: {"status":"ok"} or similar

# Test products endpoint
curl https://ora-backend-api.vercel.app/api/products?limit=5
# Should return: Array of products

# ✅ Backend is working!
```

---

## PHASE 3: FRONTEND DEPLOYMENT (45 minutes)

### Step 3.1: Configure Frontend Environment

In `frontend/` directory:

```bash
cd /home/aravind/Downloads/oranew/frontend

# 1. Update .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://ora-backend-api.vercel.app
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[your_key]
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF

# 2. Verify next.config.js has image optimization:
cat next.config.js
# Should have:
# images: {
#   remotePatterns: [
#     { protocol: 'https', hostname: '**.supabase.co' }
#   ]
# }
```

### Step 3.2: Connect Frontend to Vercel

```bash
cd /home/aravind/Downloads/oranew/frontend

# Option A: Via CLI (easiest)
vercel link
# When asked:
# - Set up and deploy? → Yes
# - Project name → ora-frontend
# - Root directory → .
# - Override settings? → No

# Option B: Via GitHub (recommended for auto-deploys)
# 1. Go to: https://vercel.com/new
# 2. Select "Import Git Repository"
# 3. Connect GitHub account
# 4. Find your repository
# 5. Select root directory: ./frontend
# 6. Click "Import"
```

### Step 3.3: Add Frontend Environment Variables to Vercel

```bash
# 1. Vercel Dashboard > ora-frontend project
# 2. Settings > Environment Variables
# 3. Add these variables:

NEXT_PUBLIC_API_URL=https://ora-backend-api.vercel.app
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[your_key]
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 4. Set environment: Production
# 5. Click "Save"
```

### Step 3.4: Deploy Frontend

```bash
cd /home/aravind/Downloads/oranew/frontend

# Deploy to production
vercel --prod

# Wait for deployment
# You'll see: ✓ Production: https://ora-frontend.vercel.app
```

### Step 3.5: Verify Frontend Deployment

```bash
# Test frontend is loading
curl https://ora-frontend.vercel.app/
# Should return: HTML page content

# Test collections page
curl https://ora-frontend.vercel.app/collections
# Should return: HTML with products

# ✅ Frontend is working!
```

---

## PHASE 4: DOMAIN CONFIGURATION (30 minutes)

### Step 4.1: Configure Frontend Domain (orashop.com)

```bash
# 1. Vercel Dashboard > ora-frontend > Settings > Domains
# 2. Click "Add Domain"
# 3. Enter: orashop.com
# 4. Vercel will suggest adding these DNS records:

# Option A: Use Vercel Nameservers (easier)
# - Change your domain registrar's nameservers to:
#   ns1.vercel.com
#   ns2.vercel.com
#   ns3.vercel.com
#   ns4.vercel.com
# - Wait 24-48 hours for DNS propagation

# Option B: Add CNAME record (faster)
# - In your domain registrar (GoDaddy, Namecheap, etc):
#   Name: @ (or blank)
#   Type: CNAME
#   Value: cname.vercel-dns.com
# - Wait 5-30 minutes for propagation
```

### Step 4.2: Configure Backend Domain (api.orashop.com)

```bash
# 1. Vercel Dashboard > ora-backend-api > Settings > Domains
# 2. Click "Add Domain"
# 3. Enter: api.orashop.com
# 4. Add CNAME record in your registrar:

# In your domain registrar:
# Name: api
# Type: CNAME
# Value: ora-backend-api.vercel.app

# Wait for DNS propagation (5-30 minutes)
```

### Step 4.3: Verify DNS Configuration

```bash
# Check if DNS has propagated
nslookup orashop.com
# Should resolve to: Vercel IP

nslookup api.orashop.com
# Should resolve to: ora-backend-api.vercel.app

# ✅ DNS configured!
```

### Step 4.4: Update Frontend Environment Variables (after DNS)

Once domains are live:

```bash
# 1. Vercel Dashboard > ora-frontend > Settings > Environment Variables
# 2. Update NEXT_PUBLIC_API_URL:

NEXT_PUBLIC_API_URL=https://api.orashop.com
NEXT_PUBLIC_SITE_URL=https://orashop.com

# 3. Click "Save"
# 4. Frontend will redeploy automatically
```

---

## PHASE 5: FINAL VERIFICATION (30 minutes)

### Step 5.1: Test Frontend

```bash
# 1. Open in browser: https://orashop.com
# Should see: Homepage loading

# 2. Navigate to: https://orashop.com/collections
# Should see: Products loading with images from Supabase

# 3. Check DevTools > Network:
# - Images should load from: supabase.co/storage
# - API calls should go to: api.orashop.com
```

### Step 5.2: Test Backend API

```bash
# Test health check
curl https://api.orashop.com/api/health
# Should return: {"status":"ok"}

# Test products (public endpoint)
curl https://api.orashop.com/api/products?limit=10
# Should return: JSON array of products

# Test protected endpoint (should require token)
curl https://api.orashop.com/api/admin/products
# Should return: HTTP 401 Unauthorized

# ✅ API working correctly!
```

### Step 5.3: Test Images

```bash
# In browser DevTools:
# 1. Open collections page
# 2. Go to Network tab
# 3. Look for .supabase.co requests
# 4. All images should load successfully (HTTP 200)

# Test direct image URL:
curl "https://[project-id].supabase.co/storage/v1/object/public/product-images/[filename]"
# Should return: HTTP 200 with image data

# ✅ Images loading correctly!
```

### Step 5.4: Run Smoke Tests

```bash
#!/bin/bash

API="https://api.orashop.com"
FRONTEND="https://orashop.com"

echo "🧪 Running Smoke Tests..."

# Test 1: API Health
echo "1. Testing API health..."
if curl -s "$API/api/health" | grep -q "ok"; then
  echo "   ✅ API is healthy"
else
  echo "   ❌ API health check failed"
  exit 1
fi

# Test 2: Frontend loads
echo "2. Testing frontend..."
if curl -s "$FRONTEND/" | grep -q "html"; then
  echo "   ✅ Frontend is loading"
else
  echo "   ❌ Frontend failed to load"
  exit 1
fi

# Test 3: Products endpoint
echo "3. Testing products endpoint..."
PRODUCTS=$(curl -s "$API/api/products?limit=5" | grep -o '"id"' | wc -l)
if [ "$PRODUCTS" -gt 0 ]; then
  echo "   ✅ Products endpoint working ($PRODUCTS products found)"
else
  echo "   ❌ No products found"
  exit 1
fi

# Test 4: Collections page
echo "4. Testing collections page..."
if curl -s "$FRONTEND/collections" | grep -q "html"; then
  echo "   ✅ Collections page loading"
else
  echo "   ❌ Collections page failed"
  exit 1
fi

echo ""
echo "✅ All smoke tests passed!"
```

---

## 🚨 TROUBLESHOOTING

### Issue: Backend gives 500 error

**Solution:**
```bash
# 1. Check Vercel logs:
vercel logs https://api.orashop.com --follow

# 2. Check environment variables are set:
vercel env list

# 3. Check database connection:
# Make sure DATABASE_URL is correct in Vercel dashboard

# 4. Redeploy:
cd backend
vercel --prod
```

### Issue: Images not loading

**Solution:**
```bash
# 1. Check Supabase bucket is public:
# Supabase Dashboard > Storage > product-images
# Should show: Public bucket

# 2. Check image URL format:
# Should be: https://[project].supabase.co/storage/v1/object/public/product-images/[filename]

# 3. Test direct access:
curl "https://[project].supabase.co/storage/v1/object/public/product-images/test.jpg"
# Should return: HTTP 200 with image
```

### Issue: API calls from frontend getting 403

**Solution:**
```bash
# 1. Check CORS in backend:
# backend/src/server.ts should have:
cors({
  origin: ['https://orashop.com', 'http://localhost:3000'],
  credentials: true,
})

# 2. Redeploy backend:
cd backend
vercel --prod

# 3. Wait for deployment to complete
```

### Issue: DNS not resolving

**Solution:**
```bash
# 1. Verify DNS settings in registrar:
nslookup orashop.com
nslookup api.orashop.com

# 2. If not resolved, check:
# - Domain registrar is pointing to correct nameservers
# - Wait 24-48 hours for full DNS propagation
# - Try clearing browser DNS cache

# 3. Or use Vercel's built-in DNS:
# Vercel Dashboard > Domains > Change nameservers
```

---

## ✅ DEPLOYMENT CHECKLIST

Before going live:

- [ ] Supabase project created
- [ ] RLS policies enabled (copy-paste SQL)
- [ ] Storage bucket created (product-images)
- [ ] Backend deployed to Vercel
- [ ] Backend environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] Domains configured (orashop.com, api.orashop.com)
- [ ] DNS propagated (5-48 hours)
- [ ] All smoke tests passing
- [ ] Images loading correctly
- [ ] API endpoints responding
- [ ] Collections page showing products
- [ ] Admin panel accessible
- [ ] Error tracking configured (optional)

---

## 📊 DEPLOYMENT SUMMARY

```
Estimated Time: 2-3 hours
Total Cost: $0 (free tier)

VERCEL BACKEND (Serverless)
├─ URL: https://api.orashop.com
├─ Auto-scales with traffic
├─ Database: Supabase
├─ Storage: Supabase Storage
└─ Status: ✅ Production Ready

VERCEL FRONTEND (Next.js)
├─ URL: https://orashop.com
├─ Auto-deploys from GitHub
├─ Image optimization: Enabled
├─ Analytics: Enabled
└─ Status: ✅ Production Ready

SUPABASE (Database + Storage)
├─ Database: PostgreSQL
├─ Storage: Product images
├─ RLS: Enabled
├─ Backups: Daily
└─ Status: ✅ Production Ready
```

---

## 🎯 NEXT STEPS

After deployment:

1. **Monitor:** Vercel Dashboard > Analytics
2. **Logs:** Vercel Dashboard > Logs
3. **Errors:** Set up Sentry for error tracking
4. **Performance:** Check Core Web Vitals
5. **Backups:** Enable Supabase backups
6. **SSL:** Auto-enabled by Vercel ✅

---

**Status: ✅ PRODUCTION DEPLOYED**

**Questions?** Refer to VERCEL_DEPLOYMENT_SETUP.md or SUPABASE_INTEGRATION_GUIDE.md
