# VERCEL SERVERLESS IMPLEMENTATION CHECKLIST
## Complete Step-by-Step Verification

**Project:** ORA Jewellery Serverless  
**Status:** IMPLEMENTATION PHASE  
**Target:** January 30, 2026  

---

## 📋 PART 1: PROJECT STRUCTURE

### Backend Directory Structure
- [ ] `/backend/api/` folder exists
- [ ] `/backend/api/health.ts` created
- [ ] `/backend/api/products.ts` created
- [ ] `/backend/api/categories.ts` created
- [ ] `/backend/api/cart.ts` created
- [ ] `/backend/api/orders.ts` created
- [ ] `/backend/api/upload.ts` created
- [ ] `/backend/api/admin/` folder exists
- [ ] `/backend/api/admin/products.ts` created
- [ ] `/backend/api/auth/` folder exists
- [ ] `/backend/api/auth/login.ts` created
- [ ] `/backend/api/auth/verify.ts` created
- [ ] `/backend/api/payments/` folder exists
- [ ] `/backend/api/payments/webhook.ts` created
- [ ] `/backend/lib/` folder exists
- [ ] `/backend/lib/prisma.ts` created
- [ ] `/backend/lib/supabase.ts` created
- [ ] `/backend/lib/auth.ts` created
- [ ] `/backend/lib/handlers.ts` created
- [ ] `/backend/vercel.json` created
- [ ] `/backend/.env.production` created
- [ ] `/backend/SUPABASE_RLS_POLICIES.sql` created

### Frontend Updates
- [ ] `/frontend/src/lib/api.ts` updated
- [ ] No Express dependencies in frontend
- [ ] No direct Supabase client in frontend

---

## 📦 PART 2: DEPENDENCIES

### Backend package.json
- [ ] Removed: `express`, `cors`, `express-rate-limit`
- [ ] Removed: `multer`, `nodemon`
- [ ] Added: `@vercel/node`
- [ ] Added: `parse-multipart`
- [ ] Kept: `@prisma/client`, `jsonwebtoken`, `bcryptjs`
- [ ] Kept: `@supabase/supabase-js`, `razorpay`
- [ ] Scripts updated: `"dev": "vercel dev"`
- [ ] Scripts updated: `"build": "tsc && prisma generate"`
- [ ] Scripts updated: `"start": "node dist/api/health.js"`
- [ ] Node version: 18.x

### Frontend Dependencies
- [ ] Kept: `axios`
- [ ] Kept: `next`, `react`, `typescript`
- [ ] No breaking changes

---

## 🔐 PART 3: AUTHENTICATION & SECURITY

### JWT Implementation
- [ ] `JWT_SECRET` is minimum 32 characters
- [ ] `createJWT()` function exists in `/lib/auth.ts`
- [ ] `verifyJWT()` function exists in `/lib/auth.ts`
- [ ] `extractToken()` function parses "Bearer <token>"
- [ ] `requireAuth()` throws on missing token
- [ ] `requireAdmin()` throws on non-admin role
- [ ] Token format: `Authorization: Bearer <token>`
- [ ] Token expiration: 7 days
- [ ] No session storage (stateless)

### Supabase RLS
- [ ] RLS enabled on `products` table
- [ ] RLS enabled on `categories` table
- [ ] RLS enabled on `product_images` table
- [ ] RLS enabled on `orders` table
- [ ] RLS enabled on `users` table
- [ ] Policy: Public can read active products
- [ ] Policy: Only ADMIN can create products
- [ ] Policy: Only ADMIN can update products
- [ ] Policy: Only ADMIN can delete products
- [ ] Policy: Only ADMIN can manage categories
- [ ] Policy: Users can read their own orders
- [ ] Policy: ADMIN can read all orders

### CORS & Origins
- [ ] `ALLOWED_ORIGINS` includes frontend URL
- [ ] CORS headers in `vercel.json`
- [ ] Frontend can call `/api/*` endpoints
- [ ] Preflight requests (OPTIONS) handled

---

## 🔌 PART 4: API ENDPOINTS

### Public Endpoints (No Auth Required)
- [ ] `GET /api/health` - Returns status, timestamp, uptime
- [ ] `GET /api/products` - Returns paginated products
- [ ] `GET /api/products?slug=:slug` - Returns single product
- [ ] `GET /api/categories` - Returns all categories
- [ ] `POST /api/cart` - Verifies cart items
- [ ] `POST /api/orders` - Creates order
- [ ] `GET /api/orders?id=:id` - Gets order by ID

### Admin Endpoints (JWT Required)
- [ ] `GET /api/admin/products` - Lists all products with search
- [ ] `POST /api/admin/products` - Creates new product
- [ ] `PUT /api/admin/products?id=:id` - Updates product
- [ ] `DELETE /api/admin/products?id=:id` - Deletes product

### Auth Endpoints
- [ ] `POST /api/auth/login` - Returns JWT token
- [ ] `POST /api/auth/verify` - Verifies token validity

### Upload Endpoints (Admin Only)
- [ ] `POST /api/upload` - Uploads image to Supabase Storage
- [ ] Returns public URL of uploaded image

### Payment Endpoints
- [ ] `POST /api/payments/webhook` - Razorpay webhook handler
- [ ] No authentication required for webhook
- [ ] Verifies signature with `RAZORPAY_WEBHOOK_SECRET`
- [ ] Updates order status on payment events

---

## 🗄️ PART 5: DATABASE & STORAGE

### Prisma Setup
- [ ] `prisma/schema.prisma` exists
- [ ] Database URL uses `pgbouncer=true`
- [ ] `DIRECT_URL` separate from `DATABASE_URL`
- [ ] Migrations created and tested locally
- [ ] `prisma generate` in build command
- [ ] `prisma migrate deploy` in build command

### Supabase Storage
- [ ] Bucket name: `product-images`
- [ ] Bucket is PUBLIC READ
- [ ] Upload only via backend
- [ ] Files stored as: `products/{timestamp}-{filename}`
- [ ] Public URLs returned in responses
- [ ] Images display correctly in product cards

---

## 🌍 PART 6: ENVIRONMENT VARIABLES

### Backend (.env.production)
- [ ] `DATABASE_URL` has pgbouncer connection
- [ ] `DIRECT_URL` is pooled connection URL
- [ ] `SUPABASE_URL` is correct project URL
- [ ] `SUPABASE_ANON_KEY` is anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is service role key
- [ ] `JWT_SECRET` is 32+ characters
- [ ] `RAZORPAY_KEY_ID` is `rzp_live_*` (production)
- [ ] `RAZORPAY_KEY_SECRET` is production secret
- [ ] `RAZORPAY_WEBHOOK_SECRET` is webhook secret
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL` matches domain
- [ ] `ALLOWED_ORIGINS` includes frontend

### Frontend (.env.local)
- [ ] `NEXT_PUBLIC_API_URL` points to Vercel backend
- [ ] `NEXT_PUBLIC_SITE_URL` is orashop.com
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is anon access only
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public key

### Vercel Environment
- [ ] All variables added to Vercel dashboard
- [ ] Separate vars for staging/production if needed
- [ ] No hardcoded secrets in code

---

## 🛠️ PART 7: ERROR HANDLING

### Backend Error Handling
- [ ] `withErrorHandling()` wrapper on all handlers
- [ ] 401 for missing token
- [ ] 403 for insufficient permissions
- [ ] 404 for not found
- [ ] 400 for validation errors
- [ ] 500 for server errors
- [ ] Console logs for debugging
- [ ] No sensitive data in error messages

### Frontend Error Handling
- [ ] API client catches errors
- [ ] 401 redirects to login
- [ ] 403 shows permission error
- [ ] Network timeouts handled
- [ ] User-friendly error messages
- [ ] Console logs for debugging

---

## 🚀 PART 8: DEPLOYMENT

### Git Repository
- [ ] All code committed to GitHub
- [ ] `.gitignore` excludes `node_modules`, `.env`
- [ ] No sensitive data in git history
- [ ] `main` branch is production-ready

### Vercel Configuration
- [ ] Backend project imports `/backend` root
- [ ] Frontend project imports `/frontend` root
- [ ] Build commands are correct
- [ ] Environment variables added
- [ ] Domains configured (api.orashop.com, orashop.com)
- [ ] Auto-deployments enabled

### DNS Configuration (GoDaddy)
- [ ] `api.orashop.com` → Vercel CNAME
- [ ] `www.orashop.com` → Vercel CNAME
- [ ] Root domain redirects to www
- [ ] DNS propagation verified

---

## ✅ PART 9: TESTING

### Health Checks
- [ ] `curl https://api.orashop.com/api/health` → 200 OK
- [ ] Response includes status, timestamp, uptime
- [ ] <100ms response time

### Product Endpoints
- [ ] `GET /api/products` returns list
- [ ] `GET /api/products?slug=test` returns single
- [ ] `GET /api/categories` returns categories
- [ ] Pagination works (page, limit)
- [ ] All image URLs are valid

### Admin Endpoints
- [ ] `POST /api/auth/login` returns JWT token
- [ ] `POST /api/admin/products` with token creates product
- [ ] `PUT /api/admin/products/:id` with token updates
- [ ] `DELETE /api/admin/products/:id` with token deletes
- [ ] 401 without token
- [ ] 403 without admin role

### Upload Endpoint
- [ ] `POST /api/upload` with file uploads image
- [ ] Returns public URL
- [ ] File exists in Supabase Storage
- [ ] File is accessible at public URL

### Cart & Orders
- [ ] `POST /api/cart` with items verifies stock
- [ ] `POST /api/orders` creates order in database
- [ ] `GET /api/orders?id=:id` retrieves order
- [ ] Order status updates on payment

### Payment Webhook
- [ ] `POST /api/payments/webhook` from Razorpay is received
- [ ] Signature verification passes
- [ ] Order status updates (CONFIRMED/FAILED)
- [ ] Returns 200 OK (prevents retries)

### Frontend Integration
- [ ] Login works → gets JWT token
- [ ] Products page displays all products
- [ ] Category filtering works
- [ ] Admin dashboard accessible to ADMIN users
- [ ] Product create/edit/delete works
- [ ] Image upload stores in Supabase
- [ ] Cart & checkout process works
- [ ] Payment flow completes
- [ ] Order confirmation appears

---

## 📊 PART 10: PERFORMANCE

### API Performance
- [ ] API responds <500ms for most requests
- [ ] List endpoints support pagination
- [ ] Database queries are optimized
- [ ] No N+1 query problems
- [ ] Images optimized (WebP, compression)

### Serverless Specifics
- [ ] No cold start delays visible
- [ ] Concurrent requests handled
- [ ] Memory limits not exceeded
- [ ] Execution time <10 seconds per request
- [ ] No long-running background jobs

### Frontend Performance
- [ ] Next.js static generation where applicable
- [ ] Images lazy-loaded
- [ ] Code-splitting enabled
- [ ] No blocking scripts
- [ ] Lighthouse score >80

---

## 🔍 PART 11: MONITORING & LOGGING

### Vercel Analytics
- [ ] Dashboard accessible
- [ ] Real-time request monitoring
- [ ] Performance metrics visible
- [ ] Error rates monitored
- [ ] Deployment history visible

### Backend Logs
- [ ] Errors logged to console
- [ ] Requests logged in development
- [ ] Payment events logged
- [ ] Authentication attempts logged
- [ ] Database errors captured

### Alerting Setup (Optional)
- [ ] Email alerts on errors (Sentry, etc.)
- [ ] Uptime monitoring enabled
- [ ] Performance degradation alerts
- [ ] Payment failure alerts

---

## 🎯 FINAL VERIFICATION

### Security Checklist
- [ ] No hardcoded secrets
- [ ] No direct database access from frontend
- [ ] JWT validation on all admin routes
- [ ] RLS enforced on database
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Rate limiting considered (if needed)

### Functionality Checklist
- [ ] All 7 public endpoints working
- [ ] All 4 admin endpoints working
- [ ] Auth endpoints working
- [ ] Upload working
- [ ] Webhook working
- [ ] Database reads working
- [ ] Database writes working
- [ ] Image display working

### Scalability Checklist
- [ ] No memory state stored
- [ ] No global variables
- [ ] No file system writes
- [ ] Connection pooling enabled
- [ ] Ready for 10x traffic

---

## 📋 SIGN-OFF

### When all items are ✅:

```
✅ Project Structure: COMPLETE
✅ Dependencies: UPDATED
✅ Authentication: IMPLEMENTED
✅ API Endpoints: FUNCTIONAL
✅ Database: CONFIGURED
✅ Environment: SECURED
✅ Error Handling: COMPREHENSIVE
✅ Deployment: READY
✅ Testing: PASSED
✅ Performance: OPTIMIZED
✅ Monitoring: ACTIVE

🚀 READY FOR PRODUCTION LAUNCH
```

---

## 📞 DEPLOYMENT EXECUTION

Once all items above are verified:

1. **Deploy Backend:** Follow VERCEL_DEPLOYMENT_GUIDE.md Phase 2
2. **Deploy Frontend:** Follow VERCEL_DEPLOYMENT_GUIDE.md Phase 3
3. **Configure Domains:** Follow VERCEL_DEPLOYMENT_GUIDE.md Phase 4
4. **Setup Webhooks:** Follow VERCEL_DEPLOYMENT_GUIDE.md Phase 5
5. **Run Production Tests:** Follow VERCEL_DEPLOYMENT_GUIDE.md Phase 7

---

**Status:** ✅ CHECKLIST READY FOR USE
