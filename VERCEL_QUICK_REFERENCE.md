# VERCEL SERVERLESS QUICK REFERENCE
## Developer's Cheat Sheet

---

## 🚀 DEPLOYMENT QUICK COMMANDS

```bash
# 1. Prepare code
cd /home/aravind/Downloads/oranew
git add .
git commit -m "feat: Vercel serverless"
git push origin main

# 2. Deploy backend (in Vercel Dashboard)
# - Import: oranew repo
# - Root: /backend
# - Env vars: Copy from .env.production

# 3. Deploy frontend (in Vercel Dashboard)
# - Import: oranew repo
# - Root: /frontend
# - Env vars: NEXT_PUBLIC_API_URL=<backend-url>

# 4. Test
curl https://api.orashop.com/api/health
```

---

## 📂 FOLDER STRUCTURE CHEAT SHEET

```
backend/
├── api/                  ← Vercel auto-detects this
│   ├── health.ts
│   ├── products.ts
│   ├── categories.ts
│   ├── cart.ts
│   ├── orders.ts
│   ├── upload.ts
│   ├── admin/products.ts
│   ├── auth/login.ts
│   ├── auth/verify.ts
│   └── payments/webhook.ts
├── lib/
│   ├── prisma.ts
│   ├── supabase.ts
│   ├── auth.ts
│   └── handlers.ts
├── vercel.json
├── .env.production
└── package.json

frontend/
└── src/
    └── lib/
        └── api.ts        ← Updated for serverless
```

---

## 🔌 API ENDPOINTS CHEAT SHEET

### Public (No Auth)
```
GET    /api/health                    → Status check
GET    /api/products?page=1           → List products
GET    /api/products?slug=name        → Single product
GET    /api/categories                → List categories
POST   /api/cart                      → Verify cart items
POST   /api/orders                    → Create order
GET    /api/orders?id=:id             → Get order
```

### Admin (JWT Required)
```
GET    /api/admin/products            → List all products
POST   /api/admin/products            → Create product
PUT    /api/admin/products?id=:id     → Update product
DELETE /api/admin/products?id=:id     → Delete product
```

### Auth
```
POST   /api/auth/login                → Get JWT token
POST   /api/auth/verify               → Verify token
```

### Upload
```
POST   /api/upload                    → Upload image (JWT required)
```

### Webhook
```
POST   /api/payments/webhook          → Razorpay webhook
```

---

## 🔐 JWT TOKEN USAGE

### Get Token
```typescript
// Frontend
const response = await api.post('/api/auth/login', {
  email: 'admin@example.com',
  password: 'password'
});
const { token } = response.data.data;
localStorage.setItem('ora_token', token);
```

### Use Token
```typescript
// Frontend - Axios automatically adds header
const response = await api.get('/api/admin/products');

// Or manual
fetch('https://api.orashop.com/api/admin/products', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Verify Token
```typescript
// Backend
import { requireAdmin } from '../lib/auth';

const admin = requireAdmin(req.headers.authorization);
console.log(admin.role); // 'ADMIN'
```

---

## 🗄️ DATABASE QUICK REFERENCE

### Connection
```
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
```

### Prisma Commands
```bash
npm run prisma:generate    # Generate client
npm run prisma:migrate     # Create migration
npm run prisma:push        # Push schema
npm run prisma:deploy      # Deploy migrations
npm run prisma:studio      # Open Studio GUI
```

### RLS Policy Example
```sql
CREATE POLICY products_public_read
ON products FOR SELECT
USING (is_active = true);

CREATE POLICY products_admin_write
ON products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);
```

---

## 📦 ENVIRONMENT VARIABLES QUICK REFERENCE

### Backend (.env.production)
```
DATABASE_URL=postgresql://...?pgbouncer=true
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=min32chars...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
NODE_ENV=production
FRONTEND_URL=https://orashop.com
ALLOWED_ORIGINS=https://orashop.com,https://www.orashop.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.orashop.com
NEXT_PUBLIC_SITE_URL=https://orashop.com
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## ✅ VERIFICATION CHECKLIST (5 minutes)

```bash
# 1. Health check
curl https://api.orashop.com/api/health
# Expected: {"success":true,"data":{"status":"OK",...}}

# 2. Products list
curl https://api.orashop.com/api/products
# Expected: {"success":true,"data":{"products":[...]}}

# 3. Admin with token
TOKEN="your_jwt_token"
curl -H "Authorization: Bearer $TOKEN" \
  https://api.orashop.com/api/admin/products
# Expected: {"success":true,"data":[...]}

# 4. Admin without token (should fail)
curl https://api.orashop.com/api/admin/products
# Expected: {"success":false,"error":"Unauthorized"}

# 5. Products with image
curl https://api.orashop.com/api/products
# Check: imageUrl fields have valid URLs

# 6. Order creation
curl -X POST https://api.orashop.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"id","quantity":1}],"shippingAddress":"...","email":"...","phone":"..."}'
# Expected: {"success":true,"data":{"id":"...","status":"PENDING"}}
```

---

## 🐛 COMMON ERRORS & FIXES

| Error | Fix |
|-------|-----|
| 401 Unauthorized | Add `Authorization: Bearer <token>` header |
| 403 Forbidden | User must have `role: 'ADMIN'` in DB |
| Cannot find module | `npm install <module> --save-dev` |
| DATABASE_URL invalid | Add `pgbouncer=true` to URL |
| Cold start slow | Not an issue, Vercel <100ms default |
| CORS error | Check `ALLOWED_ORIGINS` env var |
| Image upload fails | Check Supabase bucket is `PUBLIC READ` |
| Webhook not received | Verify webhook secret exactly matches |

---

## 🔄 COMMON WORKFLOWS

### Create Product (Admin)
```typescript
const token = localStorage.getItem('ora_token');

const product = await api.post('/api/admin/products', {
  name: 'Gold Ring',
  slug: 'gold-ring',
  price: 5000,
  stock: 10,
  categoryId: 'cat-123',
  description: '...',
  images: ['https://...jpg']
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Upload Image (Admin)
```typescript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('https://api.orashop.com/api/upload', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData
});

const { data } = await response.json();
console.log(data.url); // Public image URL
```

### Create Order (User)
```typescript
const order = await api.post('/api/orders', {
  items: [
    { productId: 'id1', quantity: 2, size: 'M' },
    { productId: 'id2', quantity: 1 }
  ],
  shippingAddress: '123 Main St, City',
  email: 'user@example.com',
  phone: '+919999999999'
});

console.log(order.data.id); // Order ID for payment
```

### Verify Token (Frontend)
```typescript
const isValid = await api.post('/api/auth/verify', {
  token: localStorage.getItem('ora_token')
});

if (isValid.data.valid) {
  console.log('Token is valid, user:', isValid.data.user);
} else {
  localStorage.removeItem('ora_token');
  // Redirect to login
}
```

---

## 📊 MONITORING & LOGS

### Check Vercel Logs
```
Vercel Dashboard → Select Project → Deployments → Logs
```

### Check Supabase Logs
```
Supabase Dashboard → Project → Logs → Recent Queries
```

### Check RLS Policies
```
Supabase Dashboard → Project → Policies → View All
```

### Test Database Connection
```bash
psql $DATABASE_URL
# Should connect successfully
```

---

## 🚀 PRE-LAUNCH CHECKLIST (1 hour)

- [ ] All env vars in Vercel dashboard
- [ ] Backend deploy successful (green checkmark)
- [ ] Frontend deploy successful (green checkmark)
- [ ] Custom domains configured (GoDaddy)
- [ ] Razorpay webhook URL updated
- [ ] Health endpoint responds
- [ ] Products endpoint returns data
- [ ] Admin login returns JWT token
- [ ] Image uploads to Supabase Storage
- [ ] Orders table has test order
- [ ] Payment webhook received
- [ ] Frontend displays no errors
- [ ] Mobile responsive looks good

---

## 🎯 HANDY LINKS

| Resource | URL |
|----------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://app.supabase.com |
| Razorpay Dashboard | https://dashboard.razorpay.com |
| GoDaddy Dashboard | https://www.godaddy.com/reseller |
| Vercel Docs | https://vercel.com/docs |
| Prisma Docs | https://www.prisma.io/docs |
| Supabase Docs | https://supabase.com/docs |

---

## 💡 TIPS & TRICKS

### Development
```bash
# Local testing
npm run dev              # Start Vercel dev server

# Database
npm run prisma:studio   # Visual DB browser

# Logs
VERCEL_DEBUG=1 npm run dev
```

### Deployment
```bash
# Redeploy latest
vercel --prod

# Check logs
vercel logs https://api.orashop.com
```

### Debugging
```typescript
// Add debug logs
console.log('[DEBUG]', { data, error });

// Check in Vercel dashboard Logs
```

---

## ⚡ PERFORMANCE TIPS

- ✅ Use pagination: `GET /api/products?page=1&limit=12`
- ✅ Images are optimized: use Supabase CDN URLs
- ✅ Database: queries auto-optimized by Prisma
- ✅ Frontend: use Next.js Image component
- ✅ Serverless: functions auto-scale, no tuning needed

---

**Last Updated:** January 25, 2026  
**Version:** 1.0  
**Status:** ✅ READY FOR USE
