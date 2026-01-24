# 📋 PHASE 2 — SINGLE SOURCE OF TRUTH (PRODUCT VISIBILITY RULE)

**Date**: 24 January 2026  
**Status**: ✅ DEFINITION COMPLETE  

---

## THE RULE

### Single Visibility Rule for All Products

```
A product is VISIBLE TO CUSTOMERS on the storefront (Collections, Search, etc.)
IF AND ONLY IF:

  isActive = true
  AND
  (no other conditions)

PERIOD. FINAL. NO EXCEPTIONS.
```

---

## Detailed Rule Definition

### For Storefront (Customers)

**Visibility Rule**: `WHERE isActive = true`

**What This Means**:
- Product must have `isActive` flag set to `true`
- No additional filters (no `published`, `draft`, `deleted` flags needed)
- Stock level irrelevant for visibility (out-of-stock products still show, marked as unavailable)
- Price irrelevant for visibility (all price points visible)
- Category required for filtering, not visibility

**Endpoints Affected**:
- `GET /api/products` — Collections/Browse
- `GET /api/products/:slug` — Product detail
- `GET /api/products/featured` — Homepage featured section
- `GET /api/products/search` — Search results
- `GET /api/products/id/:id` — Cart validation (shows even if inactive, for existing cart items)

---

### For Admin (Operations/Management)

**Admin Rule**: `NO FILTER` (see everything)

**What This Means**:
- Admins see ALL products regardless of `isActive` status
- Why: Admins need to manage, edit, and restore inactive products
- Admins should see:
  - Products ready to go live (`isActive: true`)
  - Draft products being prepared (`isActive: false`)
  - Archived products (`isActive: false` but historically important)

**Endpoints Affected**:
- `GET /api/admin/products` — Admin product list
- `GET /api/admin/products/:id` — Admin edit product

**Important**: Admin can toggle `isActive` on/off as needed

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│ PRODUCT IN DATABASE                                          │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ id: "123", name: "Gold Ring", isActive: true        │  │
│ │ categoryId: "rings-id", stockQuantity: 5, price: 499 │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   ADMIN      │ │  COLLECTIONS │ │   SEARCH     │
    │   PANEL      │ │   PAGE       │ │   ENDPOINT   │
    │              │ │              │ │              │
    │ Query:       │ │ Query:       │ │ Query:       │
    │ NO filter    │ │ isActive=true│ │ isActive=true│
    │              │ │ + category   │ │ + keyword    │
    │ Result:      │ │              │ │              │
    │ ✅ VISIBLE   │ │ Result:      │ │ Result:      │
    │              │ │ ✅ VISIBLE   │ │ ✅ VISIBLE   │
    └──────────────┘ └──────────────┘ └──────────────┘
```

---

## What Changes and What Doesn't

### ✅ No Database Schema Changes
```
Product model stays EXACTLY as is:
- Only isActive field used for visibility
- No new fields needed (published, draft, deleted, etc.)
```

### ✅ Backward Compatible
```
All existing products:
- Keep their isActive status (true/false)
- Continue working as before
- Zero data migration needed
```

### 🔧 Code Changes Required
```
1. Ensure Admin Product Creation Form
   └─ Always sends isActive: true by default
   └─ User can toggle via checkbox
   
2. Ensure Storefront API Queries
   └─ ALWAYS enforce isActive: true
   └─ Make it hardcoded (not optional)
   
3. Ensure Admin API Queries
   └─ NO mandatory isActive filter
   └─ Allow optional filtering (if admin wants to see only active/inactive)
```

### ✅ No Changes to Frontend UI
```
Collections page, product cards, filters all stay the same
Admin dashboard stays the same
Product detail page stays the same
```

---

## Edge Cases Handled

### Edge Case 1: Product in Cart (Inactive)
**Scenario**: Customer has inactive product in cart (product was active when they added it, then admin deactivated it)

**Behavior**: 
- Product removed from /api/products results
- But checkout still works (API doesn't validate isActive for cart completion)
- Admin should communicate deactivation to customers

**Decision**: ✅ **ACCEPTABLE** — Business decided this is OK

---

### Edge Case 2: Inactive Product Direct URL
**Scenario**: Customer has direct link to /products/gold-ring-slug but product is inactive

**Current Behavior**: Product detail API returns 404 or empty

**After Fix**: SAME (because `GET /api/products/:slug` will filter by isActive=true)

**Decision**: ✅ **CORRECT** — Inactive products should not be accessible via direct link

---

### Edge Case 3: Admin Viewing Inactive Product
**Scenario**: Admin goes to /admin/products/[id] for inactive product

**Current Behavior**: Shows if admin authenticated

**After Fix**: SAME (because admin endpoint has no isActive filter)

**Decision**: ✅ **CORRECT** — Admins can manage inactive products

---

## Implementation Checklist

- [ ] **Backend Change 1**: Ensure `/api/products` queries HARDCODE `isActive: true` (already done ✅)
- [ ] **Backend Change 2**: Add `maxPrice` and `sortBy` parameter handling to `/api/products` (missing ❌)
- [ ] **Backend Change 3**: Ensure `/api/admin/products` allows optional isActive filtering (already done ✅)
- [ ] **Frontend Change 1**: Verify admin form sends `isActive: true` by default (already done ✅)
- [ ] **Documentation**: Update API docs to clarify the rule

---

## Rule Summary Table

| Aspect | Details |
|--------|---------|
| **Visibility Field** | `Product.isActive` (Boolean) |
| **Default Value** | `true` |
| **Storefront Logic** | `WHERE isActive = true` (MANDATORY) |
| **Admin Logic** | NO FILTER (see everything) |
| **Schema Change** | ❌ None needed |
| **Data Migration** | ❌ None needed |
| **Breaking Change** | ❌ No |
| **Backward Compatible** | ✅ Yes |

---

## Why This Rule?

1. **Simple**: One boolean field, one clear rule
2. **Maintainable**: No complex published/draft/deleted state machine
3. **Performant**: Indexed field (`@@index([isActive, isFeatured])`)
4. **Secure**: No accidental exposure of unfinished products
5. **Flexible**: Admin can toggle anytime without re-uploading
6. **Clear**: Zero ambiguity between admin and customer views

---

## END OF PHASE 2 — RULE APPROVED
