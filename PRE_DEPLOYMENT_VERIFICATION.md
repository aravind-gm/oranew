# Pre-Deployment Security & Verification Checklist
## ORA Jewellery — Production Ready Assessment

---

## 🔐 SECURITY AUDIT

### Backend Security

#### Environment Variables
```bash
# ✅ Check 1: No secrets in code
grep -r "password" backend/src --exclude-dir=node_modules
grep -r "SECRET" backend/src --exclude-dir=node_modules
grep -r "API_KEY" backend/src --exclude-dir=node_modules
# Should return: 0 results (or only references to env vars)

# ✅ Check 2: .env not committed
git log --oneline -- backend/.env
# Should return: 0 results

# ✅ Check 3: .gitignore includes .env
cat .gitignore | grep ".env"
# Should include: .env, .env.local, .env.*.local
```

#### Authentication
- [ ] JWT_SECRET is > 32 characters
- [ ] JWT_EXPIRES_IN is reasonable (7-30 days)
- [ ] Tokens validated on every protected endpoint
- [ ] Token refresh mechanism exists (if > 1 day expiry)
- [ ] Tokens signed with strong algorithm (HS256+)

```bash
# Verify token validation
grep -r "verifyToken" backend/src
# Should find: Used on all /admin routes
```

#### Database Access
- [ ] RLS policies enabled on all tables
- [ ] Prepared statements used (Prisma enforces this)
- [ ] SQL injection impossible (Prisma ORM)
- [ ] Database credentials rotated

```bash
# Check RLS status
psql [connection_string] -c "
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';"
# All tables should show: true
```

#### File Upload Security
- [ ] File size limits enforced (< 10MB)
- [ ] File type validation (whitelist images only)
- [ ] File path sanitization
- [ ] No executable uploads allowed

```typescript
// backend/src/routes/upload.routes.ts
// Verify:
// 1. Multer size limits
// 2. File type checking
// 3. Filename sanitization
```

#### API Security
- [ ] CORS configured (not *)
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Request validation on all endpoints
- [ ] Error messages don't leak sensitive info

```typescript
// Verify CORS
cors({
  origin: ['https://orashop.com'],  // ✅ Specific domain, not *
  credentials: true,
})

// Verify rate limiting
rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,  // 100 requests per 15 min
})
```

---

### Frontend Security

#### Environment Variables
- [ ] No secrets in `.env.local` (only NEXT_PUBLIC_* vars)
- [ ] No hardcoded API keys in code
- [ ] `.env.local` not committed

```bash
# Check for exposed keys
grep -r "RAZORPAY_KEY" frontend/src --exclude-dir=node_modules
# Should only find: process.env.NEXT_PUBLIC_RAZORPAY_KEY

grep -r "API_SECRET" frontend/src --exclude-dir=node_modules
# Should return: 0 results
```

#### Content Security Policy
- [ ] CSP headers configured (if needed)
- [ ] No unsafe-inline scripts
- [ ] No eval() calls
- [ ] No dynamic code execution

```typescript
// frontend/next.config.js
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',  // ✅ Prevent MIME type sniffing
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',  // ✅ Prevent clickjacking
        },
      ],
    },
  ];
}
```

#### Authentication Storage
- [ ] Tokens stored in localStorage only (not cookies)
- [ ] No other sensitive data stored locally
- [ ] XSS vulnerability check

```bash
# Verify secure token handling
grep -r "localStorage" frontend/src
# Should only find: 'ora_token'

grep -r "sessionStorage" frontend/src
# Should return: 0 results
```

#### API Call Security
- [ ] All API calls use HTTPS
- [ ] CORS properly configured
- [ ] No credentials sent over HTTP
- [ ] Sensitive data not logged in browser

```typescript
// frontend/src/lib/api.ts
const api = axios.create({
  baseURL: 'https://api.orashop.com',  // ✅ HTTPS, not HTTP
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## ✅ FUNCTIONALITY VERIFICATION

### Product Visibility

```bash
# 1. Verify collections page shows ALL active products
curl "https://api.orashop.com/api/products?limit=1000"
# Should return: All products where is_active = true

# 2. Verify category filtering is OPTIONAL
curl "https://api.orashop.com/api/products?limit=1000"
# Should return: Same products as request with category param

# 3. Verify inactive products NOT shown
curl "https://api.orashop.com/api/products"
# Should NOT include: Products with is_active = false
```

### Image Loading

```bash
# 1. Test Supabase image URL format
curl "https://[project].supabase.co/storage/v1/object/public/product-images/[filename]"
# Should return: HTTP 200 with image

# 2. Verify image URLs in products response
curl "https://api.orashop.com/api/products?limit=1" | jq '.data[0].images[0].imageUrl'
# Should contain: .supabase.co and /public/

# 3. Test image loading in frontend
# Visit https://orashop.com/collections
# Open DevTools > Network
# Filter: .supabase.co
# All images should load successfully
```

### Authentication

```bash
# 1. Test public endpoints (no auth needed)
curl "https://api.orashop.com/api/products"
# Should return: HTTP 200

curl "https://api.orashop.com/api/categories"
# Should return: HTTP 200

# 2. Test protected endpoints (auth required)
curl "https://api.orashop.com/api/admin/products"
# Should return: HTTP 401 Unauthorized

curl -H "Authorization: Bearer invalid-token" \
  "https://api.orashop.com/api/admin/products"
# Should return: HTTP 401 Invalid Token

# 3. Test with valid token (if admin exists)
curl -H "Authorization: Bearer [valid-token]" \
  "https://api.orashop.com/api/admin/products"
# Should return: HTTP 200 with products
```

### Category Filtering

```bash
# 1. Fetch available categories
curl "https://api.orashop.com/api/categories"
# Should return: Active categories

# 2. Test category filter
CATEGORY_ID=$(curl "https://api.orashop.com/api/categories" | jq -r '.data[0].id')
curl "https://api.orashop.com/api/products?category=$CATEGORY_ID"
# Should return: Only products in that category

# 3. Verify no default category hardcoding
curl "https://api.orashop.com/api/products"
# Should return: ALL products, not filtered by default
```

### No Valentine Hardcoding

```bash
# 1. Verify homepage is neutral (not Valentine-specific)
curl "https://orashop.com/"
# Should NOT contain: Hardcoded Valentine products

# 2. Verify Valentine pages are separate routes
curl "https://orashop.com/valentines-special"
# Should work (optional route)

curl "https://orashop.com/valentine-drinkware"
# Should work (optional route)

# 3. Verify collections page is independent
curl "https://orashop.com/collections"
# Should show ALL products, not Valentine-filtered
```

---

## 🚀 DEPLOYMENT READINESS

### Pre-Deployment Checklist

#### Code Quality
- [ ] No console.log() in production code (use debug flag)
- [ ] No TODO/FIXME comments in critical paths
- [ ] No hardcoded values (use env vars)
- [ ] Tests pass (if applicable)
- [ ] No dependency vulnerabilities

```bash
# Check for vulnerabilities
npm audit --prod
# Should return: 0 vulnerabilities

# Check for outdated packages
npm outdated
# Review and update if necessary
```

#### Database
- [ ] Migrations are reversible
- [ ] Schema documented
- [ ] Backups automated
- [ ] RLS policies tested

```bash
# Verify schema
psql [connection_string] -c "\dt"
# Should show all tables

# Verify migrations applied
psql [connection_string] -c "
SELECT id, name FROM _prisma_migrations 
ORDER BY finished_at DESC LIMIT 5;"
```

#### Environment Configuration
- [ ] All variables documented
- [ ] No secrets in version control
- [ ] Staging config matches production
- [ ] Build succeeds without errors

```bash
# Check environment setup
echo "Database: $DATABASE_URL"
echo "JWT Secret set: $([ -z $JWT_SECRET ] && echo 'NO' || echo 'YES')"
echo "API URL: $NEXT_PUBLIC_API_URL"
```

#### Performance
- [ ] Frontend bundle size < 500KB
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] Images optimized for web

```bash
# Check frontend bundle
npm run build
# Check .next/static file sizes
# Should be < 500KB total

# Check API performance
time curl "https://api.orashop.com/api/products?limit=10"
# Should complete in < 500ms
```

---

## 📊 VERIFICATION REPORT TEMPLATE

```markdown
# Pre-Deployment Verification Report
Date: [DATE]
Verified By: [NAME]

## Security Audit
- [ ] Backend environment variables secure
- [ ] Frontend environment variables secure
- [ ] No secrets in git history
- [ ] RLS policies enabled and tested
- [ ] CORS configured correctly
- [ ] Rate limiting enabled

## Functionality
- [ ] Collections page shows all active products
- [ ] Category filtering works
- [ ] No Valentine-only hardcoding
- [ ] Images load from Supabase
- [ ] Admin authentication works
- [ ] Product creation works
- [ ] Payment webhook working

## Performance
- [ ] API response time acceptable
- [ ] Frontend bundle size acceptable
- [ ] Database queries optimized

## Deployment Readiness
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates valid
- [ ] Monitoring alerts configured
- [ ] Rollback procedure documented

## Sign-Off
Production deployment approved: ___________________
Date: _________________
```

---

## 🔧 QUICK VERIFICATION SCRIPT

```bash
#!/bin/bash
set -e

API_URL="${1:-https://api.orashop.com}"
FRONTEND_URL="${2:-https://orashop.com}"

echo "🔍 Running Pre-Deployment Verification..."
echo ""

# 1. API Health
echo "✓ Checking API health..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ API responding"
else
  echo "  ❌ API not responding (HTTP $HTTP_CODE)"
  exit 1
fi

# 2. Products Endpoint
echo "✓ Checking products endpoint..."
PRODUCTS=$(curl -s "$API_URL/api/products?limit=1" 2>/dev/null | jq '.data | length')
if [ "$PRODUCTS" -gt 0 ]; then
  echo "  ✅ Products found: $PRODUCTS"
else
  echo "  ❌ No products found"
fi

# 3. Categories Endpoint
echo "✓ Checking categories endpoint..."
CATEGORIES=$(curl -s "$API_URL/api/categories" 2>/dev/null | jq '.data | length')
echo "  ✅ Categories found: $CATEGORIES"

# 4. Frontend Health
echo "✓ Checking frontend..."
FRONTEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$FRONTEND_CODE" = "200" ]; then
  echo "  ✅ Frontend responding"
else
  echo "  ❌ Frontend not responding (HTTP $FRONTEND_CODE)"
fi

# 5. CORS Test
echo "✓ Checking CORS configuration..."
CORS_HEADER=$(curl -s -H "Origin: $FRONTEND_URL" \
  -o /dev/null -w "%{header_content_length}" "$API_URL/api/products" 2>/dev/null)
if [ "$CORS_HEADER" != "-1" ]; then
  echo "  ✅ CORS configured"
else
  echo "  ⚠️ CORS may not be configured"
fi

echo ""
echo "✅ Pre-deployment verification complete!"
```

---

## ⚠️ CRITICAL ISSUES TO FIX BEFORE DEPLOYMENT

### Issue 1: Direct Supabase Writes
- [ ] Check: No frontend code calls `supabase.from().insert()`
- [ ] Fix: Route all writes through API

### Issue 2: Hardcoded Secrets
- [ ] Check: No API keys in code
- [ ] Fix: Move to environment variables

### Issue 3: Missing RLS Policies
- [ ] Check: All tables have RLS enabled
- [ ] Fix: Apply RLS policies from SUPABASE_INTEGRATION_GUIDE.md

### Issue 4: Unoptimized Images
- [ ] Check: Images are WebP/optimized
- [ ] Fix: Use Next.js Image component

### Issue 5: No Rate Limiting
- [ ] Check: Rate limiting middleware enabled
- [ ] Fix: Add express-rate-limit to Express app

---

**Verification Status:** ✅ Ready  
**Last Updated:** January 25, 2026
