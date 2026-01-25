# ORA Jewellery: Vercel Serverless Migration Guide

**Status:** IMPLEMENTATION PHASE  
**Date:** January 25, 2026  
**Architecture:** Next.js Frontend + Vercel Serverless Backend + Supabase  

---

## 🎯 MIGRATION OBJECTIVES

Convert from:
- ❌ Traditional Express server (Render/Railway)
- ❌ Always-on backend
- ❌ Long-running memory state

To:
- ✅ Vercel Serverless Functions (Express-style)
- ✅ Stateless execution (no cold-start delays)
- ✅ Auto-scaling with zero maintenance
- ✅ Seamless integration with Next.js frontend

---

## 📁 NEW PROJECT STRUCTURE

```
/oranew
├── /frontend                 → Next.js app
│   ├── /src
│   │   ├── /app
│   │   ├── /components
│   │   ├── /lib
│   │   │   └── api.ts        (Updated API client)
│   │   └── ...
│   ├── .env.local
│   ├── next.config.js
│   └── package.json
│
├── /backend                  → Vercel Serverless Functions
│   ├── /api                  (📌 CRITICAL: Vercel auto-detects this folder)
│   │   ├── health.ts         → GET /api/health
│   │   ├── products.ts       → GET /api/products
│   │   ├── categories.ts     → GET /api/categories
│   │   ├── cart.ts           → POST/GET /api/cart
│   │   ├── orders.ts         → POST/GET /api/orders
│   │   ├── /admin
│   │   │   ├── products.ts   → ADMIN product management
│   │   │   └── ...
│   │   ├── /auth
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   └── ...
│   │   ├── /upload
│   │   │   └── index.ts      → Image upload handler
│   │   └── /payments
│   │       └── webhook.ts    → Razorpay webhook
│   │
│   ├── /lib                  (Shared utilities)
│   │   ├── prisma.ts         (Prisma client)
│   │   ├── supabase.ts       (Supabase client)
│   │   ├── auth.ts           (JWT verification)
│   │   └── storage.ts        (Supabase Storage)
│   │
│   ├── vercel.json           → Deployment config
│   ├── .env.production       → Production env variables
│   ├── package.json
│   └── tsconfig.json
│
└── /.env (root - for development)
```

---

## 🔧 KEY DIFFERENCES FROM EXPRESS

### ❌ WRONG: Traditional Express Pattern
```typescript
import express from 'express';
const app = express();

app.get('/products', (req, res) => {
  res.json({ data: 'products' });
});

app.listen(8000, () => console.log('Server running'));
```

### ✅ RIGHT: Vercel Serverless Pattern
```typescript
// /api/products.ts
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    return res.status(200).json({ data: 'products' });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Key Rules:
1. ✅ Export default `async function handler(req, res)`
2. ✅ Stateless execution
3. ❌ No `app.listen()`
4. ❌ No long-running timers/intervals
5. ❌ No storing state in memory
6. ✅ Each function is independently deployable
7. ✅ Auto-scales based on traffic

---

## 📦 MIGRATION STEPS

### Phase 1: Prepare Backend Structure
1. Create `/api` folder (Vercel auto-detects this)
2. Move route logic to serverless handlers
3. Update environment variables
4. Create `vercel.json` config

### Phase 2: Update Dependencies
1. Remove: `express`, `cors`, `multer`, `nodemon`
2. Add: `@vercel/node`, `vercel`
3. Update scripts in `package.json`

### Phase 3: Implement Handlers
1. Convert each route to `/api/*.ts` handler
2. Implement JWT auth middleware
3. Set up Supabase RLS policies
4. Configure image uploads to Supabase Storage

### Phase 4: Update Frontend
1. Update API client base URL
2. Point to serverless backend
3. Remove local server dependencies

### Phase 5: Deploy
1. Deploy backend to Vercel
2. Deploy frontend to Vercel
3. Configure environment variables
4. Test all endpoints

---

## 🚀 QUICK START CHECKLIST

- [ ] **Backend Setup**
  - [ ] Create `/api` folder structure
  - [ ] Implement 5 core handlers (health, products, categories, orders, payments)
  - [ ] Create `/lib/prisma.ts` for DB connections
  - [ ] Create `/lib/auth.ts` for JWT verification
  - [ ] Update `package.json` (remove Express)
  - [ ] Create `vercel.json` config
  - [ ] Create `.env.production` template

- [ ] **Supabase RLS Setup**
  - [ ] Enable RLS on all tables
  - [ ] Create policies for public reads
  - [ ] Create policies for admin writes (JWT auth)
  - [ ] Test policies in Supabase

- [ ] **Frontend Updates**
  - [ ] Update API base URL
  - [ ] Test all API calls
  - [ ] Verify JWT flow

- [ ] **Deployment**
  - [ ] Push to GitHub
  - [ ] Connect Vercel to GitHub
  - [ ] Configure environment variables
  - [ ] Deploy backend
  - [ ] Deploy frontend
  - [ ] Test in production

---

## 🔐 AUTHENTICATION FLOW (SERVERLESS)

### Token Flow (Stateless):
```
1. Frontend Login
   → POST /api/auth/login
   → Backend generates JWT (using JWT_SECRET)
   → Returns token to frontend

2. Frontend stores token (localStorage)

3. Frontend makes authenticated request
   → Header: Authorization: Bearer <token>
   → POST /api/admin/products
   
4. Backend validates JWT
   → Checks Authorization header
   → Verifies signature using JWT_SECRET
   → No session storage needed!

5. Backend queries Supabase with JWT
   → RLS policies check jwt() ->> 'role' = 'ADMIN'
   → Database enforces security
```

### No Memory State!
```typescript
// ✅ CORRECT: Each request is independent
export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  const user = verifyJWT(token); // Stateless verification
  // ...
}

// ❌ WRONG: Don't store sessions in memory
let sessions = {}; // This will be lost between function invocations!
```

---

## 🌍 ENVIRONMENT VARIABLES

### Backend (.env.production)
```
# Database
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...

# Supabase
SUPABASE_URL=https://*.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars

# Razorpay (Production)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Email
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_USER=admin@orashop.in
EMAIL_PASS=...

# URLs
FRONTEND_URL=https://orashop.com
BACKEND_URL=https://api.orashop.com
ALLOWED_ORIGINS=https://orashop.com,https://www.orashop.com

# Node
NODE_ENV=production
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.orashop.com
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SUPABASE_URL=https://*.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 📊 API ENDPOINTS (SERVERLESS FUNCTIONS)

### Public Endpoints
```
GET  /api/health              → Health check
GET  /api/products            → List all active products (paginated)
GET  /api/products/:slug      → Get single product
GET  /api/categories          → List all categories
POST /api/cart                → Add to cart (frontend session)
POST /api/orders              → Create order
```

### Admin Endpoints (JWT required)
```
POST   /api/admin/products       → Create product
PUT    /api/admin/products/:id   → Update product
DELETE /api/admin/products/:id   → Delete product
PUT    /api/admin/products/:id/status → Update visibility

POST   /api/admin/categories     → Create category
PUT    /api/admin/categories/:id → Update category

POST   /api/upload              → Upload image to Supabase Storage
```

### Payment Endpoints
```
POST /api/payments/webhook   → Razorpay webhook (no auth)
POST /api/payments/verify    → Verify payment (no auth)
```

---

## 🔗 DEPLOYMENT WORKFLOW

### Step 1: Backend Deployment
```bash
# In /backend directory
npm install
npm run build
# Push to GitHub

# In Vercel Dashboard:
# 1. Import project from GitHub
# 2. Select root: /backend
# 3. Add environment variables
# 4. Deploy
```

### Step 2: Frontend Deployment
```bash
# In /frontend directory
# Update .env.local with NEXT_PUBLIC_API_URL

# Push to GitHub

# In Vercel Dashboard:
# 1. Import project from GitHub
# 2. Select root: /frontend
# 3. Add environment variables
# 4. Deploy
```

### Step 3: Custom Domain
```
Backend API:   api.orashop.com  → Vercel Backend URL
Frontend:      orashop.com      → Vercel Frontend URL
```

---

## ✅ IMPLEMENTATION CHECKLIST

See: [VERCEL_SERVERLESS_IMPLEMENTATION.md](./VERCEL_SERVERLESS_IMPLEMENTATION.md)

---

## 🆘 TROUBLESHOOTING

### Issue: Cold Start Delays
**Reality:** Vercel has <100ms cold starts, negligible
**Solution:** No workarounds needed, it's fast by default

### Issue: "Cannot find module @vercel/node"
**Solution:** Install with: `npm install @vercel/node --save-dev`

### Issue: "DATABASE_URL invalid"
**Solution:** 
- Ensure pgbouncer=true in connection string
- Test locally: `psql $DATABASE_URL`

### Issue: CORS errors in frontend
**Solution:** 
- Set ALLOWED_ORIGINS in backend env
- Frontend URL must match exactly

### Issue: Image upload fails
**Solution:**
- Supabase bucket must exist
- Bucket must be PUBLIC READ
- Use SUPABASE_SERVICE_ROLE_KEY for uploads

### Issue: JWT validation fails
**Solution:**
- JWT_SECRET must be same on backend
- Token format: `Authorization: Bearer <token>`
- Use `verifyJWT(token)` from `/lib/auth.ts`

---

## 📞 NEXT STEPS

1. **Read:** [VERCEL_SERVERLESS_IMPLEMENTATION.md](./VERCEL_SERVERLESS_IMPLEMENTATION.md)
2. **Follow:** Step-by-step implementation guide
3. **Deploy:** Using Vercel CLI or dashboard
4. **Test:** All endpoints in production

---

**Migration Status:** ✅ READY TO IMPLEMENT
