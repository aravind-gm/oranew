# Vercel Deployment Configuration — ORA Jewellery
## Complete Setup for Frontend + Backend

---

## 1. FRONTEND DEPLOYMENT (Next.js on Vercel)

### Step 1: Prepare Frontend for Vercel

**File:** `frontend/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@next_public_api_url",
    "NEXT_PUBLIC_RAZORPAY_KEY": "@next_public_razorpay_key",
    "NEXT_PUBLIC_SITE_URL": "@next_public_site_url"
  }
}
```

### Step 2: Configure Environment Variables in Vercel

In Vercel Dashboard > Settings > Environment Variables:

```
NEXT_PUBLIC_API_URL = https://api-ora.vercel.app
NEXT_PUBLIC_RAZORPAY_KEY = rzp_live_[your_production_key]
NEXT_PUBLIC_SITE_URL = https://orashop.com
NEXT_PUBLIC_SUPABASE_URL = https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your_anon_key]
```

### Step 3: Deploy Frontend

```bash
# Option 1: Via Vercel CLI
cd frontend
vercel --prod

# Option 2: Via Git (Recommended)
# 1. Push to GitHub
# 2. Visit https://vercel.com/new
# 3. Import your repo
# 4. Select root directory: ./frontend
# 5. Add environment variables from Step 2
# 6. Click "Deploy"
```

### Step 4: Verify Frontend Deployment

```bash
# Test homepage
curl https://[your-vercel-domain].vercel.app/

# Test collections page
curl https://[your-vercel-domain].vercel.app/collections

# Check environment variables
curl https://[your-vercel-domain].vercel.app/api/config
```

---

## 2. BACKEND DEPLOYMENT (Express API)

### Option A: Deploy to Vercel Functions (Easiest)

**Step 1: Create Vercel Configuration**

**File:** `backend/vercel.json`
```json
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
```

**Step 2: Update package.json**

```json
{
  "name": "orashop-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc && node -e \"require('fs').copyFileSync('src/server.ts', 'dist/server.js')\"",
    "start": "node dist/server.js",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:generate": "prisma generate"
  }
}
```

**Step 3: Create .vercelignore**

```
node_modules
.git
.env.local
*.log
dist
.next
```

**Step 4: Update server.ts for Vercel**

```typescript
// backend/src/server.ts
import express from 'express';

const app = express();

// ... existing middleware and routes ...

// Vercel serverless export
export default app;

// Vercel handler
export const handler = app;

// Local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
```

**Step 5: Deploy to Vercel**

```bash
cd backend
vercel --prod
# Follow prompts, select "Other" for project type
# Set up environment variables in Vercel Dashboard
```

### Option B: Deploy to Render.com (Easier Alternative)

**Step 1: Create GitHub Repo**
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

**Step 2: Create Render Service**
- Visit https://render.com
- New > Web Service
- Connect GitHub repo
- Select root directory: `backend`
- Build Command: `npm run prisma:generate && npm run build`
- Start Command: `npm start`
- Environment: Node 20
- Region: Singapore/Mumbai
- Add environment variables (same as vercel.json)

**Step 3: Deploy**
```bash
# Render auto-deploys on git push
git push origin main
# Monitor at Render Dashboard
```

### Option C: Deploy to Railway.app (Simplest)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Set environment variables
railway variables set DATABASE_URL "..."
railway variables set JWT_SECRET "..."
# ... add all other variables

# Deploy
railway up
```

---

## 3. DOMAIN & ROUTING SETUP

### DNS Configuration for Custom Domain

**For Frontend (Vercel):**
```
CNAME: vercel.com
Points to: cname-[hash].vercel.domains

Alternatively use Vercel nameservers:
ns1.vercel.com
ns2.vercel.com
```

**For Backend API:**
```
If using Vercel Functions:
api.orashop.com CNAME → vercel.com

If using Render/Railway:
api.orashop.com CNAME → [render-domain].onrender.com
```

### Update Vercel Project Settings

**Frontend Project:**
```
Settings > Domains
Add: orashop.com
Add: www.orashop.com
Add: app.orashop.com
```

**Backend Project (if separate):**
```
Settings > Domains
Add: api.orashop.com
Add: api-v2.orashop.com (for versioning)
```

---

## 4. ENVIRONMENT VARIABLES — COMPLETE LIST

### Frontend (.env.local / Vercel)

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.orashop.com
NEXT_PUBLIC_API_TIMEOUT=30000

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[your_key]

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SITE_NAME=ORA Jewellery

# Supabase (Optional - if using directly)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your_anon_key]

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_CHAT=false
```

### Backend (.env / Vercel)

```env
# Database
DATABASE_URL="postgresql://user:pass@pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://user:pass@db.supabase.co:5432/postgres"

# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[your_anon_key]
SUPABASE_SERVICE_ROLE_KEY=[your_service_role_key]

# Authentication
JWT_SECRET="[generate_with: openssl rand -base64 32]"
JWT_EXPIRES_IN=7d

# Payment Gateway
RAZORPAY_KEY_ID=rzp_live_[your_key]
RAZORPAY_KEY_SECRET=[your_secret]
RAZORPAY_WEBHOOK_SECRET=[webhook_secret]

# Email
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_USER=admin@orashop.in
EMAIL_PASS=[your_password]
EMAIL_FROM="ORA Jewellery <admin@orashop.in>"

# CORS
FRONTEND_URL=https://orashop.com
ALLOWED_ORIGINS="https://orashop.com,https://www.orashop.com,https://app.orashop.com"

# Server
NODE_ENV=production
PORT=3001
```

---

## 5. VERCEL CONFIGURATION FOR PRODUCTION

### frontend/next.config.js (Production)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================
  // IMAGE OPTIMIZATION
  // ============================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ============================================
  // COMPRESSION & MINIFICATION
  // ============================================
  compress: true,
  productionBrowserSourceMaps: false,

  // ============================================
  // TURBOPACK (Next.js 16+)
  // ============================================
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.js',
    },
  },

  // ============================================
  // HEADERS & SECURITY
  // ============================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // ============================================
  // REWRITES & REDIRECTS
  // ============================================
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
      ],
    };
  },

  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

module.exports = nextConfig;
```

---

## 6. VERCEL DEPLOYMENT AUTOMATION

### GitHub Actions Workflow

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
      - staging
  pull_request:
    branches:
      - main

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID_FRONTEND: ${{ secrets.VERCEL_PROJECT_ID_FRONTEND }}
  VERCEL_PROJECT_ID_BACKEND: ${{ secrets.VERCEL_PROJECT_ID_BACKEND }}

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm i -g vercel
      
      - name: Pull Vercel environment
        run: |
          cd frontend
          vercel pull --yes --environment=production \
            --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build project
        run: |
          cd frontend
          vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: |
          cd frontend
          vercel deploy --prebuilt --prod \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --project-id=${{ env.VERCEL_PROJECT_ID_FRONTEND }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Vercel CLI
        run: npm i -g vercel
      
      - name: Pull Vercel environment
        run: |
          cd backend
          vercel pull --yes --environment=production \
            --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build project
        run: |
          cd backend
          vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: |
          cd backend
          vercel deploy --prebuilt --prod \
            --token=${{ secrets.VERCEL_TOKEN }} \
            --project-id=${{ env.VERCEL_PROJECT_ID_BACKEND }}
      
      - name: Run migrations
        run: |
          cd backend
          npm install
          npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

---

## 7. POST-DEPLOYMENT VERIFICATION

### Smoke Test Checklist

```bash
#!/bin/bash

API_URL="https://api.orashop.com"
SITE_URL="https://orashop.com"

echo "🔍 Running Post-Deployment Smoke Tests..."

# 1. Frontend Health
echo "✓ Testing frontend..."
curl -f $SITE_URL > /dev/null && echo "  ✅ Homepage loads" || echo "  ❌ Homepage failed"

# 2. API Health
echo "✓ Testing API..."
curl -f $API_URL/api/health > /dev/null && echo "  ✅ API health check passes" || echo "  ❌ API health check failed"

# 3. Products Endpoint
echo "✓ Testing products..."
curl -f "$API_URL/api/products?limit=5" > /dev/null && echo "  ✅ Products endpoint works" || echo "  ❌ Products endpoint failed"

# 4. Categories Endpoint
echo "✓ Testing categories..."
curl -f "$API_URL/api/categories" > /dev/null && echo "  ✅ Categories endpoint works" || echo "  ❌ Categories endpoint failed"

# 5. CORS Configuration
echo "✓ Testing CORS..."
curl -H "Origin: $SITE_URL" -f "$API_URL/api/products" > /dev/null && echo "  ✅ CORS configured" || echo "  ❌ CORS failed"

echo ""
echo "✅ Smoke tests complete!"
```

### Manual Testing

1. **Collections Page**
   - Visit https://orashop.com/collections
   - Verify products load
   - Filter by category
   - Sort by price

2. **Product Details**
   - Click on any product
   - Images should load from Supabase
   - Details should display correctly

3. **Admin Panel**
   - Visit https://orashop.com/admin
   - Create a test product
   - Upload images
   - Verify images appear in collections

4. **Payment Flow**
   - Add item to cart
   - Proceed to checkout
   - Complete Razorpay test payment
   - Verify webhook processing

---

## 8. MONITORING & LOGS

### Vercel Monitoring

```bash
# View deployment logs
vercel logs https://orashop.com --follow

# View function logs (backend)
vercel logs https://api.orashop.com --follow

# View all deployments
vercel list
```

### Set Up Alerts

**In Vercel Dashboard:**
- Settings > Monitor > Create Alert
- Alert on: Error Rate > 1%
- Alert on: Response Time > 1s
- Alert on: Deploy Failure

---

## 9. ROLLBACK PROCEDURE

```bash
# If deployment fails, rollback to previous version
vercel rollback [project-url] --no-confirm

# Or manually select previous deployment
vercel > select previous deployment > Promote to Production
```

---

## 10. SECURITY BEST PRACTICES

- [ ] Enable Vercel Preview URLs protection
- [ ] Use environment variables for all secrets
- [ ] Enable "Ignore Build Step" for preview deployments
- [ ] Configure branch protection in GitHub
- [ ] Use Vercel's auto-generated SSL certificates
- [ ] Set up IP allowlisting if needed
- [ ] Enable audit logs in Vercel Dashboard
- [ ] Use separate Vercel projects for staging/prod

---

**Status:** ✅ Ready for Production  
**Last Updated:** January 25, 2026
