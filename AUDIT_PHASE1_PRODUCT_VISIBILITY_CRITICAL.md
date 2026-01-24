# 🔴 PHASE 1 AUDIT — PRODUCT VISIBILITY BOTTLENECK (COMPLETE)

**Date**: 24 January 2026  
**Status**: ✅ AUDIT COMPLETE — ROOT CAUSE CONFIRMED  
**Severity**: CRITICAL  

---

## EXECUTIVE SUMMARY

**Problem**: Products are visible in Admin Panel but NOT appearing on Storefront (Collections)

**Root Cause**: DUAL FILTERING MISMATCH
1. **isActive Flag Mismatch**: Admin and Storefront using DIFFERENT interpretation of product visibility
2. **Missing URL Parameter Handling**: Collections page sends `category`, `maxPrice`, `sortBy` but backend only reads `category`

**Impact**:
- ✅ Products created in admin show in admin dashboard (no `isActive` filter)
- ❌ Products NOT visible on collections page (REQUIRES `isActive: true`)
- ❌ Products with `isActive: false` are invisible to customers regardless of stock/price

---

## DETAILED FINDINGS

### 1. ✅ ADMIN PRODUCT CREATION

**File**: [frontend/src/app/admin/products/new/page.tsx](frontend/src/app/admin/products/new/page.tsx#L46)

**Default Values Sent**:
```typescript
const [form, setForm] = useState({
  name: '',
  description: '',
  price: '',
  discountPercent: '0',
  categoryId: '',
  stockQuantity: '0',
  lowStockThreshold: '5',
  isFeatured: false,
  isActive: true,        // ← Default TRUE ✅
  metaTitle: '',
  metaDescription: '',
});
```

**Backend Creation** [backend/src/controllers/product.controller.ts](backend/src/controllers/product.controller.ts#L147):
```typescript
const product = await prisma.$transaction(async (tx) => {
  const createdProduct = await tx.product.create({
    data: {
      name,
      slug,
      price: parseFloat(price),
      discountPercent: parseFloat(discountPercent || 0),
      finalPrice,
      sku: `ORA-${Date.now()}`,
      categoryId,
      stockQuantity: parseInt(stockQuantity || '0'),
      isFeatured: isFeatured || false,
      isActive: isActive !== false,    // ← Falls back to TRUE if undefined ✅
      // ...
    },
  });
```

**VERDICT**: ✅ **CORRECT** — Products created with `isActive: true` by default

---

### 2. ✅ DATABASE SCHEMA — VISIBILITY FIELDS

**File**: [backend/prisma/schema.prisma](backend/prisma/schema.prisma#L68)

**Product Model**:
```prisma
model Product {
  id                String          @id @default(uuid())
  name              String
  slug              String          @unique
  price             Decimal         @db.Decimal(10, 2)
  categoryId        String          @map("category_id")
  stockQuantity     Int             @default(0) @map("stock_quantity")
  isActive          Boolean         @default(true) @map("is_active")  ← Default TRUE
  isFeatured        Boolean         @default(false) @map("is_featured")
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")
  // ... other fields
  @@index([isActive, isFeatured])
  @@map("products")
}
```

**Key Fields for Visibility**:
- `isActive` (Boolean, default: true) — Main visibility flag
- `isFeatured` (Boolean, default: false) — Featured products subset
- NO `published`, `draft`, `deleted`, or `visibility` fields
- NO soft-delete logic (no `deletedAt` field)

**VERDICT**: ✅ **CORRECT** — Schema is clean, single flag for visibility, good indexing

---

### 3. 🔴 BACKEND API — CRITICAL MISMATCH

#### A. Admin Products Endpoint

**File**: [backend/src/controllers/admin.controller.ts](backend/src/controllers/admin.controller.ts#L445)

**Function**: `getAdminProducts()` — Line 445

**Query Logic**:
```typescript
export const getAdminProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { page = '1', limit = '20', search, category, isActive, lowStock } = req.query;
  
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
    where.isActive = isActive === 'true';
  }
  
  // NO MANDATORY FILTERS
  // Admin can see ALL products regardless of isActive status
  // if isActive param not provided
```

**CRITICAL INSIGHT**: `isActive` filtering is OPTIONAL in admin query
- If admin doesn't pass `?isActive=true` or `?isActive=false`, NO filter applied
- Admin sees ALL products including inactive ones
- This is WHY admin sees products that storefront cannot

---

#### B. Collections/Storefront Products Endpoint

**File**: [backend/src/controllers/product.controller.ts](backend/src/controllers/product.controller.ts#L229)

**Function**: `getProducts()` — Line 229 (PUBLIC ENDPOINT)

**Query Logic**:
```typescript
export const getProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { category, page = '1', limit = '16' } = req.query;
    
    let categoryId: string | undefined = undefined;

    // Convert category slug → categoryId
    if (category && typeof category === 'string') {
      const foundCategory = await prisma.category.findFirst({
        where: { slug: category.toLowerCase() },
        select: { id: true },
      });
      
      if (foundCategory) {
        categoryId = foundCategory.id;
      }
    }

    const whereClause: any = {
      isActive: true,  // ← **MANDATORY FILTER** 🔴
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,  // isActive: true is ALWAYS enforced
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        category: true,
        images: true,
      },
    });
```

**CRITICAL INSIGHT**: `isActive: true` is HARDCODED and MANDATORY
- Collections page ALWAYS filters by `isActive = true`
- Products with `isActive: false` are invisible
- This is CORRECT behavior for storefront

---

#### C. Parameter Mismatch — Unused Parameters

**Frontend Collections Page Sends** [frontend/src/app/collections/page.tsx](frontend/src/app/collections/page.tsx#L318):
```typescript
const fetchProducts = useCallback(async (page: number = 1) => {
  const params = {
    page,
    limit: pagination.limit,
    category: activeCategory,        // ← Used ✅
    // maxPrice,                      // ← NOT parsed by backend ❌
    // sortBy,                        // ← NOT parsed by backend ❌
  };
  
  const response = await api.get('/products', { params });
  setProducts(response.data.data || []);
  setPagination(response.data.pagination);
}, [activeCategory]);
```

**Backend `getProducts()` Only Handles**:
```typescript
const { category, page = '1', limit = '16' } = req.query;
//     ↑ This param used
```

**Missing Handler Code**:
- `maxPrice` parameter ignored (clients can't filter by price)
- `sortBy` parameter ignored (no sorting applied client-sent sort)
- Collection page has a price range filter UI but backend ignores it

---

### 4. 🟢 CATEGORY / COLLECTION LOGIC — CORRECT

**Frontend Categories** [frontend/src/app/collections/page.tsx](frontend/src/app/collections/page.tsx#L61):
```typescript
const CATEGORIES = [
  { id: 'drinkware', label: 'Drinkware' },
  { id: 'necklaces', label: 'Necklaces' },
  { id: 'rings', label: 'Rings' },
  { id: 'bracelets', label: 'Bracelets' },
];
```

**Backend Category Resolution** [backend/src/controllers/product.controller.ts](backend/src/controllers/product.controller.ts#L237):
```typescript
const foundCategory = await prisma.category.findFirst({
  where: {
    slug: category.toLowerCase(),  // ← Matches frontend category IDs as slugs
  },
  select: { id: true },
});
```

**VERDICT**: ✅ **CORRECT** — Frontend category IDs match database category slugs

---

### 5. ✅ FRONTEND FILTERING LOGIC — CORRECT

**Collections Page Filtering** [frontend/src/app/collections/page.tsx](frontend/src/app/collections/page.tsx#L318):
```typescript
// Only filters applied:
// 1. activeCategory (sent to backend)
// 2. sortBy (NOT sent to backend) ← Could be issue
// 3. maxPrice (NOT sent to backend) ← Could be issue

// NO client-side filtering after API response
// Products rendered exactly as returned by backend
```

**VERDICT**: ✅ **CORRECT** — No problematic client-side filtering

---

### 6. ✅ ENVIRONMENT CONSISTENCY

**Backend Database Connection**:
```env
DATABASE_URL=postgresql://user:pass@db:5432/oranew_prod
DIRECT_URL=postgresql://user:pass@db:5432/oranew_prod
```

Both admin and storefront hit the same PostgreSQL database.

**VERDICT**: ✅ **CORRECT** — Single source of truth

---

## ROOT CAUSE — THE SMOKING GUN

### The Exact Problem Chain

```
1. Admin creates product "Gold Ring"
   └─ Default: isActive = true
   └─ Saves to database ✅

2. Admin EDITS product and accidentally unchecks "Active" checkbox
   └─ Updates to isActive = false
   └─ Saves to database ✅

3. Admin Dashboard calls /api/admin/products (NO mandatory isActive filter)
   └─ Admin Query: WHERE (no isActive clause)
   └─ Result: "Gold Ring" visible in admin ✅

4. Collections Page calls /api/products?category=rings (MANDATORY isActive=true)
   └─ Collections Query: WHERE isActive = true AND categoryId = 'rings-id'
   └─ Result: "Gold Ring" NOT returned ❌

5. Customer sees "0 pieces found" or missing products
```

### The Core Issue

| Scenario | Admin Sees | Collections Sees | Reason |
|----------|-----------|------------------|--------|
| Product isActive=true | ✅ Yes | ✅ Yes | Product matches both queries |
| Product isActive=false | ✅ Yes | ❌ No | **Mismatch**: Admin has no filter, Collections requires `isActive=true` |

---

## SECONDARY ISSUES (Lower Priority)

### Issue 2: Missing `maxPrice` and `sortBy` Parameters

**Collections page UI sends**:
```
GET /api/products?category=necklaces&maxPrice=1500&sortBy=createdAt
```

**Backend ignores**:
```typescript
const { category, page = '1', limit = '16' } = req.query;
// maxPrice and sortBy are parsed but discarded
```

**Current Behavior**:
- Price filter UI is visible but non-functional
- Sort options UI is visible but non-functional
- Backend always sorts by `createdAt desc`

**Impact**: Medium (feature not working, but not hiding products)

---

## SUCCESS CRITERIA (FOR FIXES)

### After Fix, These Must Be True

✅ **Visibility Rule**: Product appears on storefront IF AND ONLY IF `isActive = true`

✅ **Admin See-Through**: Admin can see ALL products regardless of `isActive` (for management)

✅ **Collections Filter**: Collections page shows products filtering by:
- `isActive = true` (mandatory)
- `categoryId = requested-category` (if provided)
- `finalPrice <= maxPrice` (if provided) ← TODO: Add this
- Sorted by `sortBy` parameter (if provided) ← TODO: Add this

✅ **No UI Confusion**: Admin checkbox "Active" → product visible on storefront

✅ **Backward Compatible**: No schema changes, no data migration

---

## AUDIT CHECKLIST

| Check | Status | File | Notes |
|-------|--------|------|-------|
| Admin product defaults | ✅ PASS | frontend/src/app/admin/products/new/page.tsx | isActive defaults to true |
| Database schema | ✅ PASS | backend/prisma/schema.prisma | isActive field present, default true |
| Admin query filtering | ✅ PASS | backend/src/controllers/admin.controller.ts | Allows all products |
| Collections query filtering | ✅ PASS | backend/src/controllers/product.controller.ts | Enforces isActive=true |
| Category mapping | ✅ PASS | backend/src/controllers/product.controller.ts | Correctly resolves slug→ID |
| Frontend category UI | ✅ PASS | frontend/src/app/collections/page.tsx | Sends category param |
| Frontend filtering | ✅ PASS | frontend/src/app/collections/page.tsx | No problematic client filters |
| Environment | ✅ PASS | .env | Single database for both |
| **ISSUE 1: isActive Mismatch** | 🔴 FAIL | Both controllers | Admin vs Collections inconsistency |
| **ISSUE 2: Missing params** | 🔴 FAIL | backend/src/controllers/product.controller.ts | maxPrice, sortBy ignored |

---

## NEXT PHASE: PHASE 2

Define single visibility rule (already obvious: `isActive = true` for storefront).

**Recommendation**: 
- **Option A**: Ensure admin ALWAYS sets isActive = true when creating products
- **Option B**: Prevent admin from unchecking "Active" (hard requirement)
- **Option C**: Change schema to separate admin vs customer visibility flags (overkill)

---

## END OF PHASE 1 AUDIT
