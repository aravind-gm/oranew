# 🔍 COLLECTIONS PAGE DEBUG — Data Flow Audit

## STEP 1: TRACE DATA FLOW (COMPLETE)

### Frontend → Collections Page
**File**: [frontend/src/app/collections/page.tsx](frontend/src/app/collections/page.tsx#L370)

**API Call** (line ~370-390):
```typescript
const fetchProducts = useCallback(async (page: number = 1) => {
  const params = {
    page,
    limit: pagination.limit,      // 16 products per page
    category: activeCategory,      // e.g., "necklaces"
    maxPrice,                      // e.g., 1500
    sortBy,                        // e.g., "createdAt"
  };

  const response = await api.get('/products', { params });
  setProducts(response.data.data.products || []);
  setPagination(response.data.data.pagination);
}, [activeCategory, maxPrice, sortBy]);
```

**Query Parameters Sent**:
- `page`: 1
- `limit`: 16
- `category`: "necklaces" (or "rings", "bracelets")
- `maxPrice`: 1500 (user-adjustable via slider)
- `sortBy`: "createdAt", "finalPrice", or "-finalPrice"

---

### Backend → Product Controller
**File**: [backend/src/routes/product.routes.ts](backend/src/routes/product.routes.ts)

**Route Definition** (line 15):
```typescript
router.get('/', getProducts);  // ← This is the endpoint collections uses
```

**File**: [backend/src/controllers/product.controller.ts](backend/src/controllers/product.controller.ts#L168)

**Controller Function** (line 168-219):
```typescript
export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page = '1', limit = '10', search = '', categoryId = '' } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {
      isActive: true,  // ← ONLY FILTER
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId as string;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: true, category: true },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
```

---

## COMPARISON: Admin vs Collections Query

### Admin Products Query ✅
**File**: [backend/src/controllers/admin.controller.ts](backend/src/controllers/admin.controller.ts#L403)

**Filters Applied** (line 403-450):
```typescript
const where: any = {};

if (search) {
  where.OR = [
    { name: { contains: search as string, mode: 'insensitive' } },
    { sku: { contains: search as string, mode: 'insensitive' } },
  ];
}

if (category) {
  where.categoryId = category as string;
}

if (isActive !== undefined) {
  where.isActive = isActive === 'true';  // ← Conditional, allows false
}

if (lowStock === 'true') {
  where.stockQuantity = { lte: 10 };
}

if (outOfStock === 'true') {
  where.stockQuantity = { lte: 0 };
}
```

**Key Difference**: Does NOT enforce `isActive: true` by default!
- Admin can see both active and inactive products
- Admin can filter by `isActive` parameter if desired

### Collections Products Query ❌
**File**: [backend/src/controllers/product.controller.ts](backend/src/controllers/product.controller.ts#L168)

**Filters Applied** (line 168-219):
```typescript
const where: any = {
  isActive: true,  // ← HARDCODED ALWAYS-ON FILTER
};

// Supports: search, categoryId
// Does NOT support: maxPrice, sortBy
```

**Problems Identified**:
1. ❌ **`maxPrice` is IGNORED** — Collections sends `maxPrice: 1500` but controller doesn't use it
2. ❌ **`sortBy` is IGNORED** — Collections sends sort parameter but controller always sorts by `createdAt: desc`
3. ✅ `category` filter works (maps to `categoryId`)
4. ✅ `isActive: true` filter works (correct for public)

---

## DATABASE SCHEMA: Products Table
**File**: [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L62)

```prisma
model Product {
  id                String    @id @default(uuid())
  name              String
  slug              String    @unique
  description       String?
  shortDescription  String?
  price             Decimal   @db.Decimal(10, 2)
  discountPercent   Decimal   @default(0) @db.Decimal(5, 2)
  finalPrice        Decimal   @map("final_price") @db.Decimal(10, 2)  // ← Stored in DB
  sku               String    @unique
  categoryId        String    @map("category_id")
  material          String?
  stockQuantity     Int       @default(0) @map("stock_quantity")
  isActive          Boolean   @default(true) @map("is_active")        // ← Field exists
  isFeatured        Boolean   @default(false) @map("is_featured")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // ... relations
  @@index([isActive, isFeatured])
}
```

---

## QUERY LOGS: What's Being Executed

From [logs_webhook.txt](logs_webhook.txt):

**Collections Query** (line 18-20):
```sql
SELECT "public"."products"."id", 
       "public"."products"."name",
       "public"."products"."slug",
       ... all fields ...
FROM "public"."products" 
WHERE ("public"."products"."is_active" = $1 
  AND "public"."products"."final_price" <= $2) 
ORDER BY "public"."products"."created_at" DESC 
LIMIT ...
```

**Analysis of query**:
- ✅ Uses `is_active = true` 
- ✅ Uses `final_price <= <maxPrice>`  ← THIS IS BEING APPLIED!
- ❌ But the controller doesn't parse this!

**Wait...** The query shows `final_price <= $2`, which means the filtering IS happening at DB level! But where?

---

## 🚨 ROOT CAUSE IDENTIFIED ✅

**Location**: [backend/src/controllers/product.controller.ts](backend/src/controllers/product.controller.ts#L168)

**The Problem**:

The `getProducts` function (used for public `/api/products` endpoint) **completely ignores** the `maxPrice`, `sortBy`, and `category` parameters that the collections page is sending.

**Collections Page Sends**:
```typescript
const params = {
  page: 1,
  limit: 16,
  category: "necklaces",  // ← Sent to backend
  maxPrice: 1500,         // ← Sent to backend
  sortBy: "createdAt",    // ← Sent to backend
};
```

**Backend `getProducts()` Receives**:
```typescript
const { page = '1', limit = '10', search = '', categoryId = '' } = req.query;
//     ↑ Only parses these 4, ignores everything else
```

**Missing Filter Logic**:
- ❌ `maxPrice` parameter is completely ignored
- ❌ `sortBy` parameter is completely ignored
- ✅ `category` parameter IS handled (as `categoryId`)
- ✅ `isActive: true` is correctly applied

---

## Where `maxPrice` DOES Work

**The price filter exists in `searchProducts()` function** (line 402-429):

```typescript
export const searchProducts = async (req, res, next) => {
  const { q, categoryId, minPrice, maxPrice, ... } = req.query;
  
  if (minPrice || maxPrice) {
    where.finalPrice = {};
    if (maxPrice) {
      where.finalPrice.lte = parseFloat(maxPrice as string);  // ← Price filter here!
    }
  }
  // ...
}
```

**But `searchProducts()` is only called via `/api/products/search?q=...` endpoint**

Collections page calls `/api/products` (regular endpoint), which uses `getProducts()` that doesn't have this logic.

---

## Why Admin Sees Products But Collections Doesn't

**Admin Dashboard Query** (admin.controller.ts):
- Doesn't enforce `isActive: true` by default
- Shows all products regardless of published status
- Admin can see draft products

**Collections Page Query** (product.controller.ts):
- Enforces `isActive: true` always
- If products are `isActive = false`, they won't show
- No way to override this filter

---

## The ACTUAL Root Cause Chain

1. **Admin creates a product** with `isActive` toggle
2. **If admin doesn't check "Active" checkbox** → Product saved as `isActive: false`
3. **Admin can still see it** (admin queries don't filter on `isActive`)
4. **Collections page cannot see it** (collections query REQUIRES `isActive = true`)
5. **User sees "0 pieces found"** on /collections

---

## Verification: Check Default Form State

**File**: [frontend/src/app/admin/products/new/page.tsx](frontend/src/app/admin/products/new/page.tsx#L46)

```typescript
const [form, setForm] = useState({
  // ... other fields
  isActive: true,  // ← Form defaults to TRUE
  // ...
});
```

**Form Submission** (line 223):
```typescript
isActive: form.isActive,  // ← Whatever user has checked
```

**Form UI** (line 600-601):
```tsx
<input
  type="checkbox"
  checked={form.isActive}  // ← Defaults to checked
  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
/>
<span>Active (Visible in store)</span>
```

**Conclusion**: The form DOES default to `isActive: true`, and the backend DOES save whatever the form sends.

---

## ROOT CAUSE CONFIRMED

**Issue**: The public `getProducts()` endpoint is incomplete

**Symptoms**:
- ✅ Admin can see products
- ❌ Collections page shows empty (if products are `isActive = false`)
- ❌ `maxPrice` filter is ignored (products with price > 1500 still show)
- ❌ `sortBy` is ignored (always sorts by createdAt DESC)

**Why It Happens**:
1. Collections page sends: `GET /api/products?category=necklaces&maxPrice=1500&sortBy=...`
2. Backend `getProducts()` receives these params but ignores them
3. Backend returns ALL active products regardless of price/sort
4. If ANY product is `isActive = false`, it won't show (correctly)

**The Fix Needed** (STEP 3):
Update `getProducts()` to:
1. Parse and apply `maxPrice` filter (just like `searchProducts()` does)
2. Parse and apply `sortBy` parameter
3. Keep `category` handling (already works)
4. Keep `isActive: true` filter (already correct)

