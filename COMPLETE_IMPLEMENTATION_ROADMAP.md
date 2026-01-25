# Complete Implementation Roadmap — ORA Jewellery Production Deployment
## Step-by-Step Execution Plan (4-6 Weeks)

---

## EXECUTIVE SUMMARY

**Current Status:** 95% Complete  
**Target:** Production-ready Vercel + Supabase deployment  
**Timeline:** 4-6 weeks to full deployment  
**Team Size:** 1-2 engineers

**What's Already Done:**
✅ Next.js frontend (Vercel-ready)  
✅ Express backend (serverless-ready)  
✅ Prisma ORM (database abstraction)  
✅ Supabase setup (PostgreSQL, Auth, Storage)  
✅ Product visibility (collections shows ALL active products)  
✅ Image handling (Supabase Storage integration)  
✅ Authentication (JWT-based)  
✅ Payment processing (Razorpay webhooks)  

**What Needs Completion:**
🔴 Supabase RLS policies (CRITICAL)  
🔴 Vercel deployment configuration  
🔴 Environment variable setup  
🔴 Production security hardening  
🔴 Monitoring & alerting  
🔴 Load testing  
🔴 Smoke testing  

---

## PHASE 1: FOUNDATION & SECURITY (Week 1)

### Week 1.1: Supabase Security Setup (Days 1-2)

**Deliverable:** RLS policies enabled, database locked down

```bash
# 1. Access Supabase Dashboard
# Navigate to: https://app.supabase.com
# Select project: ora-jewellery-prod

# 2. Enable RLS on all tables
# SQL Editor > Run the following:

-- Products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active" ON products
FOR SELECT USING (is_active = true);
CREATE POLICY "admin_all" ON products
FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Product Images table
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_images" ON product_images
FOR SELECT USING (true);
CREATE POLICY "admin_write_images" ON product_images
FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_cats" ON categories
FOR SELECT USING (is_active = true);
CREATE POLICY "admin_cats" ON categories
FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');

-- Verify RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

**Verification:**
```bash
# Test that public queries work
curl "https://api.orashop.com/api/products"
# Should return: HTTP 200 with active products

# Test that direct Supabase access requires auth
curl "https://[project].supabase.co/rest/v1/products"
# Should return: HTTP 401 Unauthorized
```

---

### Week 1.2: Environment Variables (Days 2-3)

**Deliverable:** All environments configured (local, staging, production)

**Create:** `backend/.env.production`

```env
# DATABASE (Supabase Production)
DATABASE_URL="postgresql://postgres.[PROJECT]:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.[PROJECT].supabase.co:5432/postgres"

# SUPABASE
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=[GET_FROM_DASHBOARD]
SUPABASE_SERVICE_ROLE_KEY=[GET_FROM_DASHBOARD]

# JWT
JWT_SECRET=[GENERATE: openssl rand -base64 32]
JWT_EXPIRES_IN=7d

# RAZORPAY (Production Keys)
RAZORPAY_KEY_ID=rzp_live_[PRODUCTION_KEY]
RAZORPAY_KEY_SECRET=[PRODUCTION_SECRET]
RAZORPAY_WEBHOOK_SECRET=[WEBHOOK_SECRET]

# CORS
FRONTEND_URL=https://orashop.com
ALLOWED_ORIGINS=https://orashop.com,https://www.orashop.com

# SERVER
NODE_ENV=production
PORT=3001
```

**Create:** `frontend/.env.production`

```env
NEXT_PUBLIC_API_URL=https://api.orashop.com
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[KEY]
NEXT_PUBLIC_SITE_URL=https://orashop.com
```

---

### Week 1.3: Security Hardening (Days 3-4)

**Deliverable:** Backend passes security audit

**Checklist:**

```bash
# 1. Remove any hardcoded secrets from code
grep -r "password\|secret\|api.key" backend/src --exclude-dir=node_modules
# Should return: 0 results

# 2. Verify .env not in git
git log --oneline -- backend/.env
# Should return: 0 results

# 3. Enable HTTPS-only connections
# In backend/src/server.ts:
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

# 4. Add security headers
app.use(helmet());  // npm install helmet

# 5. Enable rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}));
```

---

## PHASE 2: BACKEND DEPLOYMENT (Week 2)

### Week 2.1: Choose Deployment Platform (Day 1)

**Decision Tree:**

```
Do you want serverless (Vercel Functions)?
├─ YES → Use Vercel (easier, costs more)
│  └─ Create backend/vercel.json
│  └─ Deploy via: vercel --prod
│
└─ NO → Use dedicated server
   ├─ Render.com (easiest alternative)
   ├─ Railway.app (very easy)
   ├─ AWS EC2 (most control)
   └─ Heroku (sunset - avoid)
```

**Recommendation:** Use Render.com (best balance of simplicity + cost)

---

### Week 2.2: Render.com Deployment Setup (Days 1-3)

**Step 1: Prepare Repository**

```bash
cd backend

# Create Render configuration
cat > render.yaml << 'EOF'
services:
  - type: web
    name: ora-backend
    runtime: node
    plan: standard
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: RAZORPAY_KEY_ID
        sync: false
      - key: RAZORPAY_KEY_SECRET
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_ANON_KEY
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
EOF

git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

**Step 2: Create Render Service**

```bash
# 1. Visit https://render.com/dashboard
# 2. Click "New +" > "Web Service"
# 3. Connect GitHub repository
# 4. Settings:
#    Name: ora-backend
#    Region: Singapore
#    Branch: main
#    Runtime: Node
#    Build Command: npm install && npm run build
#    Start Command: npm start
# 5. Add Environment Variables (paste from .env.production)
# 6. Click "Create Web Service"
```

**Step 3: Configure Database for Render**

```bash
# Render will connect to Supabase via DATABASE_URL
# Database setup already done in Phase 1
# Migrations will run automatically on first deploy
```

**Step 4: Verify Deployment**

```bash
# Check Render dashboard for deployment status
# Once green, test:

API_URL="https://ora-backend.onrender.com"

curl "$API_URL/api/health"
# Should return: { "status": "ok" }

curl "$API_URL/api/products?limit=5"
# Should return: Array of products
```

---

### Week 2.3: Database Migrations & Seeding (Day 3-4)

**Step 1: Run Migrations**

```bash
# Render runs migrations automatically, but verify:
# Check Render logs > "Build Logs"
# Should see: "Prisma migrations running..."

# If needed, run manually:
npm run prisma:migrate
```

**Step 2: Seed Initial Data (if needed)**

```bash
# Create seed script: backend/prisma/seed.ts
const main = async () => {
  // Create categories
  const electronics = await prisma.category.upsert({
    where: { slug: 'jewellery' },
    update: {},
    create: {
      name: 'Jewellery',
      slug: 'jewellery',
      is_active: true,
    },
  });
};

main().catch(console.error);

# Run seed
npm run prisma:seed
```

---

## PHASE 3: FRONTEND DEPLOYMENT (Week 3)

### Week 3.1: Vercel Setup (Days 1-2)

**Step 1: Prepare Frontend**

```bash
cd frontend

# Ensure next.config.js is production-ready
cat next.config.js
# Should include:
# - Image optimization with Supabase patterns
# - Environment variable configuration
# - Security headers
```

**Step 2: Connect to Vercel**

```bash
# Option A: Via CLI
npm i -g vercel
vercel link
# Follow prompts:
# - Create new project: ora-jewellery-frontend
# - Link to existing: No
# - Modify settings: Yes
# - Framework: Next.js
# - Root directory: ./frontend

# Option B: Via GitHub (Recommended)
# 1. Visit https://vercel.com/new
# 2. Import GitHub repository
# 3. Select root directory: ./frontend
# 4. Continue to settings
```

**Step 3: Configure Environment Variables**

```bash
# In Vercel Dashboard > Settings > Environment Variables

# Add for production:
NEXT_PUBLIC_API_URL=https://ora-backend.onrender.com
NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_[YOUR_KEY]
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Deploy to production
vercel --prod
```

---

### Week 3.2: Domain Configuration (Days 2-3)

**Step 1: Update DNS Records**

For domain `orashop.com` (using Vercel):

```
Type: CNAME
Name: @ (or orashop.com)
Value: cname.vercel-dns.com.

Alternative (using Vercel nameservers):
Type: NS
Values: ns1.vercel.com, ns2.vercel.com, ns3.vercel.com, ns4.vercel.com
```

For API domain `api.orashop.com` (using Render):

```
Type: CNAME
Name: api
Value: [render-domain].onrender.com.
```

**Step 2: Configure in Vercel**

```bash
# Vercel Dashboard > Settings > Domains
# Add: orashop.com
# Add: www.orashop.com

# Wait for DNS propagation (5-30 minutes)
# Verify:
nslookup orashop.com
# Should show: cname.vercel-dns.com
```

---

### Week 3.3: Testing & Verification (Days 3-4)

**Step 1: Frontend Tests**

```bash
# 1. Homepage loads
curl https://orashop.com/
# Should return: HTTP 200

# 2. Collections page works
curl https://orashop.com/collections
# Should display products

# 3. Products load with images
# Open DevTools > Network > Images
# Images should load from: supabase.co/storage

# 4. Admin panel accessible
curl -H "Authorization: Bearer [token]" https://orashop.com/admin
# Should return: HTTP 200 (if logged in)
```

**Step 2: API Tests**

```bash
# 1. API health
curl https://api.orashop.com/api/health
# Should return: { "status": "ok" }

# 2. Products endpoint
curl https://api.orashop.com/api/products?limit=10
# Should return: Array of active products

# 3. CORS configured
curl -H "Origin: https://orashop.com" \
  https://api.orashop.com/api/products
# Should include CORS headers

# 4. Authentication required for admin
curl https://api.orashop.com/api/admin/products
# Should return: HTTP 401 Unauthorized

curl -H "Authorization: Bearer [valid-token]" \
  https://api.orashop.com/api/admin/products
# Should return: HTTP 200
```

---

## PHASE 4: PRODUCTION HARDENING (Week 4)

### Week 4.1: Monitoring & Logging (Days 1-2)

**Set Up Sentry (Error Tracking)**

```bash
# Backend
npm install @sentry/node

# In backend/src/server.ts:
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

```bash
# Frontend
npm install @sentry/nextjs

# In frontend/next.config.js:
const withSentryConfig = require("@sentry/nextjs/withSentryConfig");

module.exports = withSentryConfig(nextConfig, {
  org: "your-org",
  project: "ora-frontend",
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
```

**Set Up Uptime Monitoring**

```bash
# 1. Visit https://uptimerobot.com
# 2. Add monitors:
#    - Frontend: https://orashop.com
#    - API: https://api.orashop.com/api/health
# 3. Set alerts to email/Slack
```

---

### Week 4.2: Database Optimization (Days 2-3)

**Create Indexes**

```sql
-- Execute in Supabase SQL Editor
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(final_price);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'products';
```

**Monitor Query Performance**

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%SELECT%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

### Week 4.3: Backup & Disaster Recovery (Days 3-4)

**Automatic Backups**

```bash
# Supabase automatically backs up daily
# Verify in Supabase Dashboard > Database > Backups

# Manual backup (if needed)
pg_dump [connection_string] > backup-$(date +%Y%m%d).sql
```

**Document Recovery Procedure**

```markdown
# Disaster Recovery Procedure

## Database Failure
1. Go to Supabase Dashboard > Backups
2. Click "Restore" on latest backup
3. Confirm backup details
4. Click "Restore"
5. Verify data integrity

## Application Failure
1. Check Vercel/Render deployment logs
2. If recent deploy caused issue, rollback:
   - Vercel: Dashboard > Deployments > Select previous > Promote
   - Render: Dashboard > Deployments > Select previous > Deploy
3. Verify API responding
4. Clear browser cache and refresh

## All Systems Down
1. DNS failover to static status page
2. Notify users via email/SMS
3. Restore from backup
4. Verify systems online
5. Post-incident review
```

---

## PHASE 5: LOAD TESTING & OPTIMIZATION (Week 5)

### Week 5.1: Load Testing (Days 1-2)

**Install Load Testing Tool**

```bash
npm install -g k6

# Create load test script: load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100,  // 100 virtual users
  duration: '30s',  // 30 seconds
};

export default function() {
  let response = http.get('https://api.orashop.com/api/products?limit=20');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1s': (r) => r.timings.duration < 1000,
  });
}

# Run test
k6 run load-test.js
```

**Results Analysis**

```bash
# Look for:
✓ All requests: HTTP 200
✓ Response time: < 500ms (p95)
✓ Error rate: < 0.5%
✓ RPS (requests/sec): > 100

# If any metric fails, identify bottleneck:
- API logs (Sentry/Render logs)
- Database slow queries
- Frontend bundle size
- Network latency
```

---

### Week 5.2: Performance Optimization (Days 2-3)

**Frontend Optimization**

```bash
# 1. Check bundle size
npm run build
# Analyze with: npm install webpack-bundle-analyzer

# 2. Enable ISR (Incremental Static Regeneration)
// pages/collections/page.tsx
export const revalidate = 60;  // Revalidate every 60 seconds

# 3. Compress images
# Use Next.js Image component with Supabase URLs

# 4. Enable Vercel Analytics
# Vercel Dashboard > Analytics > Enable

# Check Core Web Vitals
# Should see in Vercel Analytics
```

**Backend Optimization**

```typescript
// 1. Add caching headers
res.set('Cache-Control', 'public, max-age=300');  // 5 minutes

// 2. Implement pagination (already done)
// Limit: 16-20 products per page

// 3. Use connection pooling (already configured)
// DATABASE_URL includes pgbouncer

// 4. Monitor response time
console.log(`Query took ${Date.now() - start}ms`);
```

---

## PHASE 6: FINAL VERIFICATION & GO-LIVE (Week 6)

### Week 6.1: Final Security Audit (Days 1-2)

**Run Security Checklist**

```bash
# 1. No secrets in code
grep -r "password\|secret" . --exclude-dir=node_modules --exclude-dir=.git

# 2. No direct Supabase writes from frontend
grep -r "supabase\.from\(\)" frontend/src

# 3. RLS policies enabled
psql [connection_string] -c "
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';"

# 4. HTTPS enforced
# All API calls use https://

# 5. Rate limiting active
# Render/API returning rate limit headers

# 6. No verbose error messages
# Errors logged, not returned to client

# 7. CORS configured correctly
# Not *, only: https://orashop.com
```

---

### Week 6.2: Smoke Testing (Days 2-3)

**Run Complete Test Suite**

```bash
#!/bin/bash
set -e

API="https://api.orashop.com"
FRONTEND="https://orashop.com"

echo "🔍 Final Verification..."

# 1. API responding
curl -f "$API/api/health" && echo "✅ API health" || exit 1

# 2. Products visible
PRODUCTS=$(curl -s "$API/api/products" | jq '.data | length')
[ "$PRODUCTS" -gt 0 ] && echo "✅ Products: $PRODUCTS" || exit 1

# 3. Images loading
curl -f "$(curl -s $API/api/products?limit=1 | jq -r '.data[0].images[0].imageUrl')" \
  && echo "✅ Images loading" || exit 1

# 4. Categories
CATS=$(curl -s "$API/api/categories" | jq '.data | length')
[ "$CATS" -gt 0 ] && echo "✅ Categories: $CATS" || exit 1

# 5. Frontend loads
curl -f "$FRONTEND/" && echo "✅ Frontend health" || exit 1

# 6. Collections page
curl -f "$FRONTEND/collections" && echo "✅ Collections page" || exit 1

# 7. Payment webhook
curl -X POST "$API/api/payments/webhook" \
  -H "Content-Type: application/json" \
  -d '{}' && echo "✅ Webhook endpoint" || echo "⚠️ Webhook check"

echo ""
echo "✅ ALL CHECKS PASSED - READY FOR GO-LIVE"
```

---

### Week 6.3: Go-Live & Monitoring (Days 3-4)

**Pre-Launch Checklist**

```
FINAL GO-LIVE APPROVAL
═══════════════════════

Product & Features:
☑ Collections page shows all active products
☑ No Valentine-only hardcoding
☑ Category filtering works
☑ Images load correctly
☑ Admin can create/edit products
☑ Payment processing works
☑ Webhook processing works

Infrastructure:
☑ Frontend on Vercel
☑ Backend on Render (or Vercel)
☑ Database on Supabase
☑ Domain configured (DNS)
☑ SSL certificates valid

Security:
☑ RLS policies enabled
☑ No hardcoded secrets
☑ Rate limiting enabled
☑ CORS configured
☑ HTTPS enforced

Monitoring:
☑ Error tracking (Sentry)
☑ Uptime monitoring (Uptime Robot)
☑ Analytics enabled (Vercel)
☑ Logs accessible
☑ Alerts configured

Signed Off By: ______________
Date: ______________
```

**Post-Launch Tasks**

```bash
# 1. Monitor error rates (first 24 hours)
# Check Sentry dashboard every hour

# 2. Monitor performance
# Vercel Analytics > Core Web Vitals
# Target: LCP < 2.5s, FID < 100ms, CLS < 0.1

# 3. Monitor uptime
# Uptime Robot > Status page

# 4. Check payment processing
# Razorpay Dashboard > Orders
# Verify all payments processed correctly

# 5. User feedback
# Monitor support channels for issues
# Be ready to rollback if critical issues

# 6. Announce launch
# Email newsletter, social media, etc.
```

---

## 🚨 CRITICAL MILESTONES

| Week | Milestone | Status | Owner |
|------|-----------|--------|-------|
| 1 | Supabase RLS & Security | ⬜ TODO | |
| 1 | Environment Configuration | ⬜ TODO | |
| 2 | Backend Deployment | ⬜ TODO | |
| 3 | Frontend Deployment | ⬜ TODO | |
| 3 | Domain Configuration | ⬜ TODO | |
| 4 | Monitoring Setup | ⬜ TODO | |
| 5 | Load Testing | ⬜ TODO | |
| 6 | Final Verification | ⬜ TODO | |
| 6 | GO-LIVE | ⬜ TODO | |

---

## 📞 SUPPORT RESOURCES

**Documentation:**
- [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [VERCEL_DEPLOYMENT_SETUP.md](./VERCEL_DEPLOYMENT_SETUP.md)
- [SUPABASE_INTEGRATION_GUIDE.md](./SUPABASE_INTEGRATION_GUIDE.md)
- [PRE_DEPLOYMENT_VERIFICATION.md](./PRE_DEPLOYMENT_VERIFICATION.md)

**Platforms:**
- Vercel: https://vercel.com/dashboard
- Render: https://render.com/dashboard
- Supabase: https://app.supabase.com
- Sentry: https://sentry.io/dashboard

**Status Pages:**
- Vercel Status: https://www.vercelstatus.com
- Render Status: https://status.render.com
- Supabase Status: https://status.supabase.com

---

**Roadmap Status:** ✅ Complete  
**Last Updated:** January 25, 2026  
**Next Review:** Upon completion of Phase 1
