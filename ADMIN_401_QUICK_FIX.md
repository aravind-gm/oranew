# Admin 401 Fix - Quick Reference

## The Bug
Admin pages crashed with "Request failed with status code 401" - token wasn't in headers.

## The Reason  
Zustand hydration happens **after** components render. Token undefined until localStorage loads.

## The Fix
Add this pattern to **every admin page**:

```typescript
// 1. Add isHydrated to destructuring
const { token, user, isHydrated } = useAuthStore();

// 2. Guard useEffect with hydration check
useEffect(() => {
  if (!isHydrated) return;  // ← CRITICAL LINE
  
  if (!token || user?.role !== 'ADMIN') {
    router.push('/admin/login');
    return;
  }
  
  fetchData();
}, [isHydrated, token, user, router, fetchData]); // ← Add isHydrated here
```

## Applied To
- ✅ admin/page.tsx (dashboard)
- ✅ admin/orders/page.tsx 
- ✅ admin/orders/[id]/page.tsx
- ✅ admin/products/page.tsx
- ✅ admin/products/new/page.tsx
- ✅ admin/products/[id]/edit/page.tsx
- ✅ admin/categories/page.tsx
- ✅ admin/returns/page.tsx
- ✅ admin/reports/page.tsx
- ✅ admin/inventory/page.tsx (also added to saveStock)

## What Now Works
✅ No 401 errors  
✅ Inventory updates save to database  
✅ All admin APIs properly authenticated  
✅ Token always included in request headers  

## Future Admin Pages
Copy the pattern above for any new admin pages.
