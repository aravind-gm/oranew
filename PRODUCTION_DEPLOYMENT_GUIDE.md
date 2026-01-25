# ORA Jewellery — Production Deployment Guide
## Vercel + Supabase Production Architecture

**Last Updated:** January 25, 2026  
**Status:** Ready for Production Deployment  
**Architecture:** Next.js on Vercel + Supabase (Database, Auth, Storage) + Serverless API Routes

---

## 🎯 Current Status

### ✅ COMPLETE & VERIFIED
- **Frontend Architecture:** Next.js 16 with Vercel-ready configuration
- **Backend API:** Express-based REST API (production-ready)
- **Database:** Supabase PostgreSQL with proper schema
- **Image Storage:** Supabase Storage (public read, authenticated write)
- **Product Visibility:** Collections page shows ALL active products by default
- **No Valentine Hardcoding:** All Valentine pages are optional routes
- **Authentication:** JWT-based, Supabase-compatible
- **Payment:** Razorpay integration (webhooks working)

### 🔍 REQUIRED VERIFICATIONS BEFORE PRODUCTION
1. **Supabase RLS Policies** — Verify read-only for public, authenticated write for admin
2. **Environment Variables** — All secrets properly configured for Vercel
3. **CORS Configuration** — Backend allows Vercel production domain
4. **Image URLs** — All images loading from Supabase Storage with proper paths
5. **API Rate Limiting** — Production-grade limits configured
6. **Error Handling** — Graceful failures for missing images/products

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Backend Setup (Express API)

#### 1. Environment Configuration
```bash
# Backend .env for Vercel Deployment
DATABASE_URL="postgresql://[user]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://[user]:[password]@db.[project].supabase.co:5432/postgres"

SUPABASE_URL="https://[project].supabase.co"
SUPABASE_ANON_KEY="[from_supabase_dashboard]"
SUPABASE_SERVICE_ROLE_KEY="[from_supabase_dashboard]"

JWT_SECRET="[generate_strong_secret_32_char_min]"
JWT_EXPIRES_IN="7d"

RAZORPAY_KEY_ID="[production_key]"
RAZORPAY_KEY_SECRET="[production_secret]"
RAZORPAY_WEBHOOK_SECRET="[webhook_secret]"

FRONTEND_URL="https://orashop.com"  # Production domain
PORT=3001  # For local testing

NODE_ENV="production"
```

#### 2. Supabase RLS Policies — MANDATORY

**Products Table (Read-only public):**
```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read policy (for collections, home, search)
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT
  USING (is_active = true);

-- Admin write policy
CREATE POLICY "admin_all_access" ON products
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'ADMIN');
```

**Product Images (Public read):**
```sql
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_images" ON product_images
  FOR SELECT
  USING (true);  -- All images are public

CREATE POLICY "admin_write_images" ON product_images
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'ADMIN');
```

**Categories (Public read):**
```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_categories" ON categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin_write_categories" ON categories
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'ADMIN');
```

#### 3. Supabase Storage Buckets

**Bucket: `product-images`**
- **Visibility:** Public (no RLS)
- **File Size Limit:** 10MB per file
- **Allowed Types:** image/jpeg, image/png, image/webp

**Configuration:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Allow public read
INSERT INTO storage.policies (bucket_id, name, definition, check, action)
VALUES (
  'product-images',
  'public_read',
  '{}',
  'true',
  'SELECT'
);

-- Allow authenticated admin write
INSERT INTO storage.policies (bucket_id, name, definition, check, action)
VALUES (
  'product-images',
  'admin_write',
  '{}',
  'auth.jwt() ->> ''role'' = ''ADMIN''',
  'INSERT, UPDATE, DELETE'
);
```

---

### Frontend Setup (Next.js on Vercel)

#### 1. Vercel Environment Variables
```bash
# Vercel Dashboard > Settings > Environment Variables

NEXT_PUBLIC_API_URL=https://api.orashop.com  # Backend API domain
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[production_key]
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from_supabase_dashboard]
```

#### 2. Next.js Configuration Verification

**File:** `frontend/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',  // ✅ Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',  // Optional: Cloudinary legacy images
      },
    ],
  },
  
  turbopack: {},  // Enable Turbopack (Next.js 16)
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  },
};

module.exports = nextConfig;
```

#### 3. Vercel Deployment Settings

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm start
```

**Output Directory:** `.next`

**Node.js Version:** 20.x (LTS)

#### 4. API Routes Configuration

**Important:** Since you're using an Express backend, do NOT use Next.js `/api` routes for business logic. All API calls go through `NEXT_PUBLIC_API_URL`.

**If you need serverless functions on Vercel:**
Create `/frontend/src/pages/api/` routes for simple proxies only:

```typescript
// pages/api/health.ts (Example: simple health check)
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
    const data = await apiResponse.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'API unavailable' });
  }
}
```

---

## 🚀 DEPLOYMENT STEPS

### Phase 1: Supabase Preparation (1 hour)

**1. Create Production Supabase Project**
```bash
# Go to https://supabase.com/dashboard
# Create new project (same region as before: ap-south-1)
# Note: Project URL, Anon Key, Service Role Key
```

**2. Migrate Database Schema**
```bash
# From backend directory
npx prisma migrate deploy

# Verify schema
psql postgresql://[connection_string]
\dt  # List tables
SELECT * FROM products LIMIT 1;
```

**3. Apply RLS Policies**
```bash
# Run SQL migrations from Supabase dashboard
# Execute all RLS policies from "Supabase RLS Policies" section above
```

**4. Test Image Storage**
```bash
# Upload test image to Supabase Storage
# Verify public URL works: https://[project].supabase.co/storage/v1/object/public/product-images/test.jpg
```

### Phase 2: Backend API Deployment (2 hours)

**Option A: Vercel Functions (Recommended)**
```bash
# Convert Express app to Vercel Functions
# Create backend/vercel.json
{
  "builds": [
    { "src": "src/server.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "src/server.ts" }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database_url",
    "DIRECT_URL": "@direct_url",
    "SUPABASE_URL": "@supabase_url",
    "JWT_SECRET": "@jwt_secret"
  }
}

# Deploy
vercel --prod
```

**Option B: Dedicated VPS/Render.com (Alternative)**
```bash
# If not using Vercel for backend, deploy to Render, Railway, or AWS

# Example: Render.com
# - Connect GitHub repo
# - Build Command: npm run build
# - Start Command: npm start
# - Environment variables: configure from .env
# - Region: Singapore/Mumbai for low latency
```

### Phase 3: Frontend Deployment to Vercel (1 hour)

```bash
# From frontend directory
cd frontend

# Connect to Vercel
vercel --prod

# Follow prompts:
# - Project name: ora-jewellery-frontend
# - Framework: Next.js
# - Environment variables: Use Vercel Dashboard

# Alternative: Deploy via Git
# 1. Push to GitHub
# 2. Connect GitHub repo to Vercel
# 3. Configure environment variables in Vercel Dashboard
# 4. Click "Deploy"
```

### Phase 4: Smoke Testing (30 minutes)

```bash
# 1. Test Collections Page
curl https://orashop.com/collections
# Should load without 401 errors

# 2. Test Product Visibility
curl https://api.orashop.com/api/products?isActive=true
# Should return only active products

# 3. Test Image Loading
# Open DevTools > Network
# Images should load from: https://[project].supabase.co/storage/...

# 4. Test Admin Routes (Authenticated)
curl -H "Authorization: Bearer [admin_token]" \
  https://api.orashop.com/api/admin/products
# Should return 200 with products

# 5. Test Payment Webhook
# Use Razorpay dashboard to send test webhook
# Check backend logs for successful processing
```

---

## 🔐 SECURITY CHECKLIST

### Backend Security

- [ ] JWT_SECRET is strong (32+ characters, no repeats)
- [ ] Database credentials rotated and unique per environment
- [ ] CORS allows only production frontend domain
- [ ] Rate limiting enabled on all public endpoints
- [ ] File upload validation (size, type, virus scan)
- [ ] SQL injection prevention (Prisma parameterization)
- [ ] HTTPS enforced on all routes
- [ ] Sensitive logs redacted in production

### Frontend Security

- [ ] No hardcoded credentials in code
- [ ] API keys in environment variables only
- [ ] Sensitive data not stored in localStorage
- [ ] CSP headers configured in Vercel
- [ ] CORS headers properly set
- [ ] No direct database access from client code
- [ ] All API calls go through backend

### Data Protection

- [ ] Supabase RLS policies enabled
- [ ] Product images encrypted in transit
- [ ] User passwords hashed (bcryptjs)
- [ ] JWT tokens validated on every request
- [ ] Database backups automated
- [ ] GDPR compliance for user data

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Performance

```sql
-- Create indexes for common queries
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_final_price ON products(final_price);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM products WHERE is_active = true LIMIT 20;
```

### Image Optimization

```typescript
// frontend/src/lib/imageUrlHelper.ts
export function normalizeImageUrl(url: string): string {
  if (!url) return '/placeholder.jpg';
  
  // Ensure Supabase URLs have proper public path
  if (url.includes('supabase.co')) {
    if (!url.includes('/public/')) {
      return url.replace('/object/', '/object/public/');
    }
  }
  
  return url;
}
```

### Caching Strategy

**Vercel Edge Cache (Frontend):**
- Collections page: 1 minute ISR
- Product pages: 1 minute ISR
- Category pages: 5 minutes ISR

**Backend Cache (Optional):**
- Products list: 5 minutes Redis
- Categories: 1 hour Redis
- Featured products: 30 minutes Redis

```typescript
// Next.js ISR Configuration
export const revalidate = 60; // 1 minute
```

---

## 🔄 CI/CD PIPELINE

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Test Backend
        run: |
          cd backend
          npm ci
          npm run build
          npm test
      
      - name: Test Frontend
        run: |
          cd frontend
          npm ci
          npm run build
          npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy Backend
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./backend
      
      - name: Deploy Frontend
        run: vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
        working-directory: ./frontend
```

---

## 🎯 PRODUCT VISIBILITY RULES

### Collections Page (Default Behavior)

```typescript
// frontend/src/app/collections/page.tsx
// DEFAULT: Shows ALL active products (no category filter)

const fetchProducts = useCallback(async (page: number = 1) => {
  const params: any = {
    page,
    limit: pagination.limit,
  };

  // Only add category filter if user explicitly selects one
  if (activeCategory) {
    params.category = activeCategory;
  }

  const response = await api.get('/products', { params });
  setProducts(response.data.data || []);
}, [activeCategory, pagination.limit]);
```

### Backend Filter Logic

```typescript
// backend/src/controllers/product.controller.ts
// MANDATORY: isActive = true for all public endpoints

const whereClause: any = {
  isActive: true,  // Only show active products
};

if (categoryId) {
  whereClause.categoryId = categoryId;  // Optional category filter
}
```

### NO Valentine-Only Hardcoding

✅ **Correct:** Valentine pages at `/valentines-special` and `/valentine-drinkware` are optional routes
❌ **Incorrect:** Homepage hardcoded to show only Valentine products

---

## 📞 SUPPORT & MONITORING

### Production Monitoring

- **Uptime:** Set up Pingdom/Uptime Robot to monitor https://orashop.com
- **Errors:** Enable Sentry or LogRocket for error tracking
- **Performance:** Use Vercel Analytics to monitor Core Web Vitals
- **Database:** Enable Supabase monitoring for slow queries

### Alert Rules

```bash
# Alert if API response time > 1000ms
# Alert if error rate > 1%
# Alert if database connections > 80%
# Alert if storage usage > 80%
```

### Logs & Debugging

```bash
# View Vercel logs
vercel logs https://orashop.com

# View Supabase database logs
# Dashboard > Logs > Functions

# View API error logs
# Check backend monitoring tool (Sentry/LogRocket)
```

---

## 🔄 POST-DEPLOYMENT TASKS

### Week 1
- [ ] Monitor error rates and performance metrics
- [ ] Verify all payment webhooks working
- [ ] Test admin product creation/updates
- [ ] Load test with simulated traffic
- [ ] Review security audit checklist

### Week 2-4
- [ ] Optimize slow queries based on monitoring
- [ ] Implement advanced caching if needed
- [ ] Set up automated database backups
- [ ] Configure email notifications for errors
- [ ] Plan database maintenance windows

### Monthly
- [ ] Review and rotate credentials
- [ ] Update dependencies
- [ ] Analyze user analytics
- [ ] Plan feature releases
- [ ] Security audits

---

## 🆘 ROLLBACK PROCEDURES

**If Deployment Fails:**

```bash
# 1. Revert Frontend
vercel rollback https://orashop.com

# 2. Revert Backend
git revert HEAD
vercel deploy --prod

# 3. Check Database
# Ensure migrations are compatible
npx prisma migrate resolve --rolled-back <migration_name>

# 4. Verify APIs
curl https://api.orashop.com/health
```

---

## 📝 NOTES FOR TEAM

1. **Always test staging before production**
2. **Keep .env files out of version control**
3. **Never commit database credentials**
4. **Use Vercel secrets for sensitive values**
5. **Monitor logs for errors in first hour after deploy**
6. **Have rollback plan documented**
7. **Database migrations should be reversible**

---

**Deployment Status:** ✅ READY  
**Last Verified:** January 25, 2026  
**Next Review:** February 25, 2026
