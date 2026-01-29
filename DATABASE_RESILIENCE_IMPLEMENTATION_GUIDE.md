# 🎯 Supabase + Prisma Database Fix - Implementation Guide

## Step-by-Step Implementation

This guide shows exactly how to implement the production-grade database fixes in your codebase.

---

## Step 1: Update Your Environment Variables

### For Render Deployment

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Click **"Environment"**
4. Add/Update these variables:

```
DATABASE_URL=postgresql://postgres.XXXX:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true
DIRECT_URL=postgresql://postgres.XXXX:PASSWORD@db.XXXX.supabase.co:5432/postgres?schema=public
NODE_ENV=production
```

**Important**: Use **port 6543** for DATABASE_URL (pooler), **port 5432** for DIRECT_URL (direct)

### For Vercel Deployment (Frontend)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your frontend project
3. Click **"Settings"** → **"Environment Variables"**
4. Add:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

---

## Step 2: Verify Prisma Configuration

Check your `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      # ← Uses pgbouncer pooler
  directUrl = env("DIRECT_URL")        # ← Direct connection for migrations
}
```

This is **already correct** in your codebase. ✅

---

## Step 3: Update Your Backend Controllers

Wrap all Prisma queries with `withRetry()` for auto-recovery.

### Example 1: Product Controller

**Before (vulnerable to crashes):**
```typescript
import { prisma } from '../config/database';

router.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 10,
    });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error); // Crashes on DB error
  }
});
```

**After (resilient with retries):**
```typescript
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';

router.get('/products', async (req, res, next) => {
  try {
    const products = await withRetry(
      () => prisma.product.findMany({
        where: { isActive: true },
        take: 10,
      }),
      {
        maxRetries: 3,
        onRetry: (attempt, error, delayMs) => {
          console.log(`[Retry ${attempt}] Fetching products, retrying in ${delayMs}ms`);
        },
      }
    );
    res.json({ success: true, data: products });
  } catch (error) {
    next(error); // Error handler returns 503, not 500
  }
});
```

### Example 2: Order Controller

```typescript
import { withRetry } from '../utils/retry';

router.post('/orders', async (req, res, next) => {
  try {
    const order = await withRetry(() =>
      prisma.order.create({
        data: {
          userId: req.body.userId,
          items: req.body.items,
          total: req.body.total,
        },
        include: { items: true },
      })
    );
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});
```

### Example 3: Complex Transaction

```typescript
import { withRetry } from '../utils/retry';

router.post('/checkout', async (req, res, next) => {
  try {
    // Wrap entire transaction with retry
    const result = await withRetry(() =>
      prisma.$transaction(async (tx) => {
        // Deduct inventory
        await tx.product.update({
          where: { id: req.body.productId },
          data: { inventory: { decrement: req.body.quantity } },
        });

        // Create order
        const order = await tx.order.create({
          data: {
            userId: req.body.userId,
            status: 'completed',
          },
        });

        return order;
      })
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
```

---

## Step 4: Verify Error Handler

Your `src/middleware/errorHandler.ts` already has the 503 logic. ✅

It automatically:
- Detects `PrismaClientInitializationError`
- Returns **503** (not 500) to signal temporary issue
- Includes `retryable: true` in response

Frontend will see:
```json
{
  "success": false,
  "message": "Database temporarily unavailable. Please retry.",
  "retryable": true
}
```

---

## Step 5: Verify Frontend Retry Logic

Your `src/lib/api.ts` already has 503 retry built-in. ✅

It automatically:
- Detects 503 responses
- Waits 2-8 seconds (exponential backoff)
- Retries up to 3 times
- Shows nothing to user (silent retry)

**Example usage in components:**

```typescript
// src/components/ProductCard.tsx
import api from '@/lib/api';

export function ProductCard({ productId }) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // API client handles 503 retries automatically
        const response = await api.get(`/products/${productId}`);
        setProduct(response.data.data);
      } catch (error) {
        if (error.response?.status === 503) {
          // Still failed after 3 retries - show message
          alert('Database is temporarily unavailable. Please try again in a moment.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) return <Skeleton />;
  if (!product) return <div>Failed to load</div>;
  return <div>{product.name}</div>;
}
```

---

## Step 6: Update Specific Routes

Find and update these critical routes:

### 1. Product Routes (`backend/src/routes/product.routes.ts`)

```typescript
import { withRetry } from '../utils/retry';

// GET all products
router.get('/', async (req, res, next) => {
  try {
    const products = await withRetry(() =>
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: true, brand: true },
      })
    );
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// GET product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await withRetry(() =>
      prisma.product.findUnique({
        where: { id: req.params.id },
        include: { category: true, reviews: true },
      })
    );
    if (!product) return res.status(404).json({ success: false });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});
```

### 2. Cart Routes (`backend/src/routes/cart.routes.ts`)

```typescript
import { withRetry } from '../utils/retry';

// GET cart
router.get('/:userId', async (req, res, next) => {
  try {
    const cartItems = await withRetry(() =>
      prisma.cartItem.findMany({
        where: { userId: req.params.userId },
        include: { product: true },
      })
    );
    res.json({ success: true, data: cartItems });
  } catch (error) {
    next(error);
  }
});
```

### 3. Order Routes (`backend/src/routes/order.routes.ts`)

```typescript
import { withRetry } from '../utils/retry';

// GET orders
router.get('/:userId', async (req, res, next) => {
  try {
    const orders = await withRetry(() =>
      prisma.order.findMany({
        where: { userId: req.params.userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      })
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});
```

---

## Step 7: Test Your Implementation

### Test 1: Local Development

```bash
# Start backend
cd backend
npm run dev

# Watch logs for:
# "[Keep-Alive] Database connected"
```

### Test 2: Test Retry Logic

Add a test endpoint:

```typescript
router.get('/health/db-test', async (req, res, next) => {
  try {
    const count = await withRetry(() =>
      prisma.product.count(),
      {
        onRetry: (attempt, error, delayMs) => {
          console.log(`Attempt ${attempt}: ${error.message} (retry in ${delayMs}ms)`);
        },
      }
    );
    res.json({ success: true, databaseConnected: true, productCount: count });
  } catch (error) {
    next(error);
  }
});
```

Then:
```bash
curl http://localhost:5000/api/health/db-test
# Should return: { "success": true, "databaseConnected": true, "productCount": 123 }
```

### Test 3: Simulate Database Down

Temporarily modify `database.ts`:

```typescript
export const checkDatabaseHealth = async (): Promise<boolean> => {
  // Force failure for testing
  throw new Error("Simulated database maintenance");
};
```

Then:
1. Restart backend
2. Call API: `curl http://localhost:5000/api/products`
3. Should get: `{ "success": false, "message": "Database temporarily unavailable", "retryable": true }`
4. Revert the change and restart

---

## Step 8: Deploy & Monitor

### Render Deployment

```bash
# Push to GitHub
git add .
git commit -m "feat: add production-grade database resilience"
git push origin main

# Render auto-deploys
# Monitor backend logs for:
# - "[Keep-Alive] Database connected"
# - No "PrismaClientInitializationError" errors
# - If DB down: "[ERROR] 🔴 Database Connection Error"
```

### Vercel Deployment (Frontend)

```bash
# Push frontend changes
git add frontend/
git commit -m "feat: add 503 auto-retry to API client"
git push origin main

# Vercel auto-deploys
```

### Monitor Logs

**Render Backend Logs:**
```
[Keep-Alive] Database connected
[API] GET /products
[API] Response 200
```

**If Database Down:**
```
[Keep-Alive] Database unreachable: Can't reach database server
[ERROR] 🔴 Database Connection Error
[Retry 1] Fetching products, retrying in 500ms
[Retry 2] Fetching products, retrying in 1000ms
[Retry 3] Fetching products, retrying in 2000ms
[API] GET /products → 503 (after 3 retries failed)
```

**Frontend Console:**
```
[API 503] Service unavailable. Retry 1/3 after 2000ms
[API 503] Service unavailable. Retry 2/3 after 4000ms
[API 503] Service unavailable. Retry 3/3 after 8000ms
[API] GET /products (final retry failed)
```

---

## Quick Checklist

- [ ] Updated `DATABASE_URL` to use port 6543 (pooler)
- [ ] Updated `DIRECT_URL` to use port 5432 (direct)
- [ ] Wrapped critical routes with `withRetry()`
- [ ] Error handler returns 503 for DB errors
- [ ] Frontend API client has 503 retry logic
- [ ] Tested locally with `npm run dev`
- [ ] Deployed to Render/Vercel
- [ ] Monitored logs for "Database connected"
- [ ] Tested Supabase restart (without crashing app)

---

## Example Files to Update

1. ✅ `backend/src/config/database.ts` - Already done
2. ✅ `backend/src/utils/retry.ts` - Created
3. ✅ `backend/src/utils/dbErrors.ts` - Created
4. ✅ `backend/src/middleware/errorHandler.ts` - Updated
5. ✅ `frontend/src/lib/api.ts` - Updated
6. 📝 `backend/src/routes/*.ts` - Add `withRetry()` to all queries
7. ✅ Environment variables - Set in Render/Vercel dashboard

---

## Support & Troubleshooting

### Connection Still Fails?

1. Verify credentials in Supabase dashboard
2. Check `DATABASE_URL` has **port 6543**
3. Test direct connection: `psql postgresql://user:password@pooler.supabase.com:6543/postgres`

### Retries Not Working?

1. Check error handler middleware is registered last
2. Verify `withRetry()` wraps Prisma call
3. Check browser console for retry logs

### Frontend Doesn't Retry?

1. Check `api.ts` response interceptor for 503 logic
2. Verify `_retryCount` tracking is present
3. Clear browser cache and reload

---

**Ready to deploy?** Push your changes and monitor the logs!
