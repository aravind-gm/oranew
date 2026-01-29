# 💻 Database Resilience - Before & After Code Examples

This document shows real code examples of how to implement the database resilience fixes.

---

## Example 1: Product Routes

### BEFORE (Vulnerable to Crashes)

```typescript
// backend/src/routes/product.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

const router = Router();

// GET all products
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, brand: true },
      take: 20,
    });
    res.json({ success: true, data: products });
  } catch (error) {
    // If DB is down, this crashes the app
    next(error);
  }
});

// GET product by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, reviews: true },
    });
    if (!product) return res.status(404).json({ success: false });
    res.json({ success: true, data: product });
  } catch (error) {
    // No retry logic - fails immediately
    next(error);
  }
});

// GET products by category
router.get('/category/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { categoryId: req.params.categoryId, isActive: true },
    });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

export default router;
```

### AFTER (Production-Grade Resilience)

```typescript
// backend/src/routes/product.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { withRetry } from '../utils/retry';

const router = Router();

// GET all products - WITH AUTO-RETRY
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Wrap Prisma query with automatic retry (3 attempts)
    const products = await withRetry(() =>
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: true, brand: true },
        take: 20,
      })
    );
    res.json({ success: true, data: products });
  } catch (error) {
    // If all retries fail, error handler returns 503
    // Frontend will automatically retry
    next(error);
  }
});

// GET product by ID - WITH AUTO-RETRY
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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
    // If still fails, returns 503 with retryable=true
    next(error);
  }
});

// GET products by category - WITH AUTO-RETRY
router.get('/category/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await withRetry(() =>
      prisma.product.findMany({
        where: { categoryId: req.params.categoryId, isActive: true },
      })
    );
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

export default router;
```

**Key Changes**:
1. Import `withRetry` from utils
2. Wrap each Prisma query with `withRetry(() => ...)`
3. Error handling stays same - errors go to middleware
4. Middleware now returns 503 instead of 500

---

## Example 2: Cart Routes

### BEFORE

```typescript
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.params.userId },
      include: { product: true },
    });
    res.json({ success: true, data: cartItems });
  } catch (error) {
    next(error); // Crashes if DB is down
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartItem = await prisma.cartItem.create({
      data: {
        userId: req.body.userId,
        productId: req.body.productId,
        quantity: req.body.quantity,
      },
    });
    res.json({ success: true, data: cartItem });
  } catch (error) {
    next(error); // No retries
  }
});
```

### AFTER

```typescript
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartItems = await withRetry(() =>
      prisma.cartItem.findMany({
        where: { userId: req.params.userId },
        include: { product: true },
      })
    );
    res.json({ success: true, data: cartItems });
  } catch (error) {
    next(error); // Returns 503, frontend retries
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartItem = await withRetry(() =>
      prisma.cartItem.create({
        data: {
          userId: req.body.userId,
          productId: req.body.productId,
          quantity: req.body.quantity,
        },
      })
    );
    res.json({ success: true, data: cartItem });
  } catch (error) {
    next(error); // Auto-retries 3 times before returning 503
  }
});
```

**Pattern**: Always wrap Prisma calls with `withRetry()`

---

## Example 3: Complex Transaction

### BEFORE (Vulnerable)

```typescript
router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
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
          total: req.body.total,
        },
      });

      // Record payment
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: req.body.total,
          method: req.body.paymentMethod,
        },
      });

      return order;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    // If DB goes down mid-transaction, app crashes
    next(error);
  }
});
```

### AFTER (Resilient)

```typescript
router.post('/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Wrap ENTIRE transaction with retry
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
            total: req.body.total,
          },
        });

        // Record payment
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: req.body.total,
            method: req.body.paymentMethod,
          },
        });

        return order;
      }),
      {
        maxRetries: 5, // More retries for critical operations
        onRetry: (attempt, error, delayMs) => {
          console.log(`[Checkout Retry] Attempt ${attempt}: ${error.message}`);
        },
      }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    // If all retries exhausted, returns 503
    // Frontend shows: "Payment processing, please wait..."
    next(error);
  }
});
```

**Key Point**: Wrap entire transaction, not individual operations

---

## Example 4: Admin Routes

### BEFORE

```typescript
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = {
      totalProducts: await prisma.product.count(),
      totalOrders: await prisma.order.count(),
      totalRevenue: 0, // Would calculate from orders
      activeUsers: await prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error); // One DB error fails entire stats endpoint
  }
});

router.post('/product/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.create({
      data: {
        name: req.body.name,
        sku: req.body.sku,
        price: req.body.price,
        // ... other fields
      },
    });
    res.json({ success: true, data: product });
  } catch (error) {
    next(error); // Crashes on DB down
  }
});
```

### AFTER

```typescript
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Wrap each count in retry
    const [productCount, orderCount, userCount] = await Promise.all([
      withRetry(() => prisma.product.count()),
      withRetry(() => prisma.order.count()),
      withRetry(() => prisma.user.count({ where: { role: 'CUSTOMER' } })),
    ]);

    const stats = {
      totalProducts: productCount,
      totalOrders: orderCount,
      totalRevenue: 0, // Would calculate from orders
      activeUsers: userCount,
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    // If any count fails after retries, returns 503
    next(error);
  }
});

router.post('/product/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await withRetry(() =>
      prisma.product.create({
        data: {
          name: req.body.name,
          sku: req.body.sku,
          price: req.body.price,
          // ... other fields
        },
      })
    );
    res.json({ success: true, data: product });
  } catch (error) {
    // Returns 503 if DB is temporarily down
    next(error);
  }
});
```

**Key Points**:
1. Wrap each Prisma call
2. Use `Promise.all()` for parallel queries
3. All retried automatically
4. Errors return 503 for temporary issues

---

## Example 5: Frontend Component

### BEFORE (Breaks on 503)

```typescript
// frontend/src/components/ProductList.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        setProducts(response.data.data);
      } catch (error: any) {
        // Shows error immediately without retrying
        setError(error.response?.data?.message || 'Failed to load products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(p => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
```

### AFTER (Auto-Retries on 503)

```typescript
// frontend/src/components/ProductList.tsx
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // API client handles 503 retries automatically
        // User sees nothing - just a loader
        const response = await api.get('/products');
        setProducts(response.data.data);
        setError(null);
      } catch (error: any) {
        // Only shown if all retries exhausted
        if (error.response?.status === 503) {
          setError('Database is temporarily unavailable. Please try again in a moment.');
        } else {
          setError(error.response?.data?.message || 'Failed to load products');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <Skeleton className="h-12" />; // Shows loader during retry
  if (error) return <div className="text-red-500">{error}</div>; // Only if all retries fail
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(p => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
}
```

**What's Better**:
1. API client handles 503 automatically (silent retries)
2. User sees loader during retries
3. Error only shown if retries exhausted
4. Smooth user experience

---

## Example 6: Custom Retry Behavior

### Simple Retry

```typescript
const data = await withRetry(() =>
  prisma.product.findMany()
);
```

### With Custom Options

```typescript
const data = await withRetry(
  () => prisma.product.findMany(),
  {
    maxRetries: 5,           // More retries for critical operations
    initialDelayMs: 1000,    // Wait longer between retries
    onRetry: (attempt, error, delayMs) => {
      console.log(`Retry ${attempt}: ${error.message} (waiting ${delayMs}ms)`);
    },
  }
);
```

### With Fallback Value

```typescript
import { withRetryAndFallback } from '../utils/retry';

const user = await withRetryAndFallback(
  () => prisma.user.findUnique({ where: { id } }),
  {
    fallbackValue: null, // Return null if all retries fail
    maxRetries: 3,
  }
);

if (user === null) {
  // User data unavailable, show cached or default data
  return res.json({ data: getCachedUser(id) || DEFAULT_USER });
}
```

---

## Example 7: Error Handling In Middleware

### BEFORE (All errors return 500)

```typescript
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500; // All errors are 500

  res.status(statusCode).json({
    success: false,
    error: { message: err.message },
  });
};
```

### AFTER (DB errors return 503)

```typescript
import { isPrismaInitError, toDatabaseErrorResponse } from '../utils/dbErrors';

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // CRITICAL: Handle Prisma DB errors with 503 response
  if (isPrismaInitError(err)) {
    const { statusCode, body } = toDatabaseErrorResponse(err);
    console.warn('[DB Error]', err.message);
    return res.status(statusCode).json(body); // Returns 503
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: { message },
  });
};
```

**Response Examples**:

✅ **Success (200)**:
```json
{ "success": true, "data": { ... } }
```

❌ **Temporary DB Error (503)**:
```json
{
  "success": false,
  "message": "Database temporarily unavailable. Please retry.",
  "retryable": true
}
```

❌ **Client Error (400)**:
```json
{
  "success": false,
  "error": { "message": "Invalid request" }
}
```

❌ **Permanent Server Error (500)**:
```json
{
  "success": false,
  "error": { "message": "Internal server error" }
}
```

---

## Summary: 3-Step Pattern

Every Prisma query now follows this pattern:

```typescript
// 1. Import utilities
import { withRetry } from '../utils/retry';

// 2. Wrap Prisma call
const result = await withRetry(() =>
  prisma.model.operation()
);

// 3. Error handling stays same (middleware catches it)
catch (error) {
  next(error);
}
```

That's it! The rest is automatic:
- Retry logic ✅
- 503 responses ✅
- Frontend auto-retry ✅
- Graceful recovery ✅

---

**Ready to implement?** Start by copying these patterns into your routes!
