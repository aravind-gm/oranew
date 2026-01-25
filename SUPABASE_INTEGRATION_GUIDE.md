# Supabase Integration & API Migration Guide
## Frontend-to-Supabase Architecture (SERVERLESS)

---

## 🎯 KEY PRINCIPLE: Frontend NEVER Writes Directly to Supabase

```
❌ WRONG:
frontend → Supabase (direct write)

✅ CORRECT:
frontend → API Routes → Supabase (authenticated write)
```

---

## 1. FRONTEND API CLIENT CONFIGURATION

### File: `frontend/src/lib/api.ts`

**STATUS:** ✅ Already configured correctly

Current implementation:
- All API calls go through `NEXT_PUBLIC_API_URL`
- Token attached to every request
- Proper error handling for 401/403
- FormData support for file uploads

**No changes needed** — it's production-ready!

---

## 2. PRODUCT VISIBILITY FIXES

### Issue: Collections page must show ALL active products

**File:** `backend/src/controllers/product.controller.ts`

**Current Status:** ✅ CORRECT

```typescript
// Line 277-281: Mandatory isActive filter
const whereClause: any = {
  isActive: true,  // ✅ Only active products shown
};

// Category is OPTIONAL (only added if user selects)
if (categoryId) {
  whereClause.categoryId = categoryId;
}
```

**Verification Query:**
```sql
SELECT * FROM products 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 20;
```

---

## 3. IMAGE HANDLING — SUPABASE STORAGE

### File: `frontend/src/lib/imageUrlHelper.ts`

**Current Status:** ✅ CORRECT

```typescript
export function normalizeImageUrl(url: string | undefined): string {
  if (!url) return '/placeholder.jpg';
  
  const imageUrl = String(url).trim();
  
  if (!imageUrl || imageUrl.includes('undefined')) {
    return '/placeholder.jpg';
  }

  // If it's a Supabase URL, ensure it has /public/ path
  if (imageUrl.includes('supabase.co')) {
    if (!imageUrl.includes('/public/')) {
      // Ensure it's a public URL (no authentication needed)
      return imageUrl.replace('/object/', '/object/public/');
    }
  }

  return imageUrl;
}
```

### Image Upload Flow

**Frontend:** `frontend/src/app/admin/products/page.tsx`

```typescript
// Images are NOT uploaded directly to Supabase
// Instead, they're sent to backend API endpoint

const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // API endpoint handles Supabase upload
  const response = await api.post('/upload', formData);
  
  return response.data.imageUrl;  // Public Supabase URL
};
```

**Backend:** `backend/src/routes/upload.routes.ts`

```typescript
// Upload endpoint writes to Supabase Storage
// Only authenticated admin can access

router.post('/', protect, authorize('ADMIN', 'STAFF'), uploadImage);

// uploadImage controller:
// 1. Validate file
// 2. Upload to Supabase Storage
// 3. Return public URL
// 4. Store URL in database
```

---

## 4. API ROUTES — SERVERLESS ENDPOINTS

### Frontend API Routes Configuration

**File:** `frontend/src/pages/api/` (Optional - for simple proxies)

Create if you need Vercel serverless functions:

```typescript
// pages/api/products.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${backendUrl}/products`, {
      headers: {
        'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`,
      },
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}
```

**Note:** This is optional. Direct calls to backend API are preferred for better control.

---

## 5. SUPABASE RLS POLICIES — REQUIRED FOR PRODUCTION

### Products Table — Public Read Only

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can read active products
CREATE POLICY "public_read_active" ON products
FOR SELECT
USING (is_active = true);

-- Admin can do everything
CREATE POLICY "admin_all" ON products
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'ADMIN'
  OR auth.jwt() ->> 'role' = 'STAFF'
);

-- Drop any allow-all policy
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
```

### Product Images — Public Read Only

```sql
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_images" ON product_images
FOR SELECT
USING (true);  -- All images are public

CREATE POLICY "admin_write_images" ON product_images
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'ADMIN'
  OR auth.jwt() ->> 'role' = 'STAFF'
);

DROP POLICY IF EXISTS "Enable read access for all users" ON product_images;
```

### Categories — Public Read Only

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_cats" ON categories
FOR SELECT
USING (is_active = true);

CREATE POLICY "admin_cats" ON categories
FOR ALL
USING (
  auth.jwt() ->> 'role' = 'ADMIN'
  OR auth.jwt() ->> 'role' = 'STAFF'
);

DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
```

### Verify RLS Status

```sql
-- Check which tables have RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies on products table
SELECT tablename, policyname, action, definition
FROM pg_policies
WHERE tablename = 'products';
```

---

## 6. BACKEND AUTHENTICATION FLOW

### JWT Token Generation

**File:** `backend/src/utils/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';

export const generateToken = (userId: string, role: string) => {
  return jwt.sign(
    { 
      id: userId, 
      role,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};
```

### Request Authentication Middleware

**File:** `backend/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = decoded as any;
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        requiredRole: roles,
        userRole: req.user.role,
      });
    }

    next();
  };
};
```

---

## 7. CRITICAL ENDPOINTS — NO FRONTEND WRITES

### Products Endpoint (Public Read)

```typescript
// GET /api/products
router.get('/', getProducts);  // ✅ Public - no auth needed

// GET /api/products/:slug
router.get('/:slug', getProductBySlug);  // ✅ Public - no auth needed

// POST /api/products (Create)
router.post('/', 
  protect,  // ✅ Require authentication
  authorize('ADMIN', 'STAFF'),  // ✅ Only admin
  createProduct
);

// PUT /api/products/:id (Update)
router.put('/:id',
  protect,  // ✅ Require authentication
  authorize('ADMIN'),  // ✅ Only admin
  updateProduct
);

// DELETE /api/products/:id
router.delete('/:id',
  protect,  // ✅ Require authentication
  authorize('ADMIN'),  // ✅ Only admin
  deleteProduct
);
```

### Upload Endpoint (Authenticated Only)

```typescript
// POST /api/upload
router.post('/',
  protect,  // ✅ MUST authenticate
  authorize('ADMIN', 'STAFF'),  // ✅ Only admin
  uploadImage  // ✅ Writes to Supabase Storage
);
```

### Orders Endpoint (User or Admin)

```typescript
// GET /api/orders (user's orders)
router.get('/',
  protect,  // ✅ Require authentication
  getOrders  // ✅ User sees only their orders (RLS)
);

// POST /api/orders (create order)
router.post('/',
  protect,  // ✅ Require authentication
  createOrder  // ✅ Creates with user_id from token
);
```

---

## 8. DATABASE CONNECTION STRINGS

### Vercel Environment Setup

```env
# Connection Pooling (for app runtime)
DATABASE_URL="postgresql://postgres.[project]:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres:password@db.[project].supabase.co:5432/postgres"
```

### For Local Development

```env
# Use pooled connection
DATABASE_URL="postgresql://postgres:password@localhost:6543/postgres?pgbouncer=true"

# For migrations, use direct connection
DIRECT_URL="postgresql://postgres:password@localhost:5432/postgres"
```

---

## 9. MIGRATION & DATA SEEDING

### Run Migrations on Deployment

```bash
# Prisma will automatically run pending migrations
npx prisma migrate deploy

# Or in CI/CD:
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
```

### Seed Initial Data

```bash
npx prisma db seed

# File: backend/prisma/seed.ts
const main = async () => {
  // Create categories
  // Create featured products
  // Create admin user
};
```

---

## 10. MISSING FEATURES TO IMPLEMENT (If Needed)

### Not Blocking Production — Optional Enhancements

1. **Wishlist API**
   ```typescript
   // POST /api/wishlist
   // GET /api/wishlist
   // DELETE /api/wishlist/:productId
   ```

2. **Review/Rating API**
   ```typescript
   // POST /api/reviews (authenticated)
   // GET /api/reviews/:productId (public)
   ```

3. **Cart API**
   ```typescript
   // POST /api/cart (authenticated)
   // GET /api/cart (authenticated)
   // DELETE /api/cart/:itemId (authenticated)
   ```

4. **Search API**
   ```typescript
   // GET /api/search?q=...
   // Use Supabase full-text search
   ```

---

## 11. TESTING CHECKLIST

### Frontend API Integration

- [ ] Collections page loads without errors
- [ ] Product details page displays correctly
- [ ] Images load from Supabase Storage
- [ ] Filtering by category works
- [ ] Sorting by price works
- [ ] Pagination works
- [ ] Admin can create products
- [ ] Admin can upload images
- [ ] Admin can edit products
- [ ] Admin cannot delete without permission

### Backend API

```bash
# Test public endpoints (no auth)
curl https://api.orashop.com/api/products
curl https://api.orashop.com/api/categories
curl https://api.orashop.com/api/products/[slug]

# Test authenticated endpoints
curl -H "Authorization: Bearer [token]" \
  https://api.orashop.com/api/admin/products

# Test upload
curl -X POST -H "Authorization: Bearer [token]" \
  -F "file=@image.jpg" \
  https://api.orashop.com/api/upload

# Test webhook
curl -X POST https://api.orashop.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

---

## 12. PRODUCTION MONITORING

### Key Metrics to Track

1. **API Response Time**: Should be < 500ms
2. **Error Rate**: Should be < 1%
3. **Database Connections**: Monitor connection pool
4. **Storage Usage**: Supabase Storage quota
5. **Function Execution Time**: Keep under 30s for Vercel

### Set Up Alerts

```typescript
// Example: Log slow queries
if (executionTime > 1000) {
  console.warn(`Slow query detected: ${query} took ${executionTime}ms`);
}
```

---

## PRODUCTION CHECKLIST

- [ ] All environment variables configured in Vercel
- [ ] Database migrations run successfully
- [ ] RLS policies enabled and tested
- [ ] Images loading from Supabase
- [ ] No direct Supabase writes from frontend
- [ ] API authentication working
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Backups automated
- [ ] SSL certificates valid
- [ ] Monitoring alerts set up

---

**Status:** ✅ Ready for Production  
**Last Updated:** January 25, 2026
