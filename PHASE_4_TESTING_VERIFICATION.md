# PHASE 4: TESTING & SMOKE TEST - STEP-BY-STEP GUIDE
## Complete Verification Before Production Launch

**Estimated Time:** 2-3 hours  
**Status:** Ready to Execute  
**Date:** January 25, 2026  

---

## 📋 PRE-REQUISITES

Before starting Phase 4, confirm Phases 1-3 are complete:

- [ ] Phase 1: Supabase RLS enabled
- [ ] Phase 2: Backend API live and responding
- [ ] Phase 3: Frontend deployed to Vercel
- [ ] Custom domains configured
- [ ] All environment variables set

---

## 🎯 PHASE 4 OBJECTIVES

✅ Test all core API endpoints  
✅ Verify collections page functionality  
✅ Test product filtering & search  
✅ Verify image loading from Supabase  
✅ Test admin authentication  
✅ Test product creation/update  
✅ Verify payment integration  
✅ Test customer checkout flow  
✅ Monitor performance metrics  
✅ Check for security vulnerabilities  

---

## ⚙️ STEP-BY-STEP TEST EXECUTION

### TEST 1: Health Check - Backend API

**Test:** API is responding

```bash
# Terminal command:
curl https://orashop-api.onrender.com/api/health

# Expected output:
{"status":"OK","uptime":"123456","timestamp":"2024-01-25T..."}
```

✅ **Result:** PASS / FAIL

---

### TEST 2: Get Products Endpoint

**Test:** Products API returns data

```bash
curl https://orashop-api.onrender.com/api/products

# Expected output:
{
  "success": true,
  "products": [
    {
      "id": "123",
      "name": "Product Name",
      "finalPrice": 999.99,
      "images": [...]
    }
  ],
  "total": 50,
  "page": 1
}
```

✅ **Result:** PASS / FAIL

---

### TEST 3: Get Categories Endpoint

**Test:** Categories API returns data

```bash
curl https://orashop-api.onrender.com/api/categories

# Expected output:
{
  "success": true,
  "categories": [
    {
      "id": "1",
      "name": "Rings",
      "slug": "rings",
      "isActive": true
    }
  ]
}
```

✅ **Result:** PASS / FAIL

---

### TEST 4: Collections Page - Load Time

**Test:** Page loads and renders correctly

```
1. Go to: https://orashop.com/collections
2. Open DevTools (F12)
3. Check Network tab:
   - Page load time < 3 seconds
   - No failed requests (red items)
   - No 404 or 500 errors
4. Check Console tab:
   - No red error messages
   - No CORS warnings
```

**Expected:**
```
✓ Page loads in < 3 seconds
✓ All images load successfully
✓ No console errors
✓ No failed API calls
```

✅ **Result:** PASS / FAIL

---

### TEST 5: Collections Page - Display All Products

**Test:** Page shows all active products by default

```
1. Go to: https://orashop.com/collections
2. Scroll down and count products displayed
3. Verify count matches backend total
4. Check no category filter is pre-selected
```

**Expected:**
```
✓ All 50+ products shown
✓ No category pre-selected
✓ "Show All" or empty category indicator
✓ Products from multiple categories visible
```

✅ **Result:** PASS / FAIL

---

### TEST 6: Collections Page - Category Filter

**Test:** Filtering by category works

```
1. Go to: https://orashop.com/collections
2. Click category filter (e.g., "Rings")
3. Observe products update
4. Verify only selected category products shown
5. Click "All" or "Clear Filter"
6. Verify all products shown again
```

**Expected:**
```
✓ Category filter works
✓ URL updates (e.g., ?category=rings)
✓ Only matching products show
✓ Product count changes
✓ Images still load correctly
```

✅ **Result:** PASS / FAIL

---

### TEST 7: Product Images - Load from Supabase

**Test:** Images load correctly from Supabase Storage

```
1. Go to: https://orashop.com/collections
2. Right-click on a product image
3. Select "Copy Image Link"
4. Verify URL format:
   https://[project].supabase.co/storage/v1/object/public/product-images/[filename]
5. Paste in new tab
6. Verify image displays (not download prompt)
```

**Expected:**
```
✓ Image URL contains /public/
✓ Image displays in browser
✓ No "download" dialog
✓ Fast load time
✓ No Supabase auth errors
```

✅ **Result:** PASS / FAIL

---

### TEST 8: Search/Sort Functionality

**Test:** Search and sort features work

```
1. Go to: https://orashop.com/collections
2. Type in search box (if available)
3. Observe products filter
4. Test sort dropdown (price low-to-high, etc.)
5. Verify results update
```

**Expected:**
```
✓ Search returns matching products
✓ Sort order changes correctly
✓ No API errors in console
✓ Results update smoothly
```

✅ **Result:** PASS / FAIL

---

### TEST 9: Admin Login & Authentication

**Test:** Admin can login and access protected routes

```bash
# Simulate admin login
curl -X POST https://orashop-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@orashop.in","password":"[password]"}'

# Expected output:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "123",
    "email": "admin@orashop.in",
    "role": "ADMIN"
  }
}
```

✅ **Result:** PASS / FAIL

---

### TEST 10: Admin - Create Product

**Test:** Admin can create new product

```bash
curl -X POST https://orashop-api.onrender.com/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [admin-token]" \
  -d '{
    "name": "Test Ring",
    "price": 5000,
    "category": "rings"
  }'

# Expected output:
{
  "success": true,
  "product": {
    "id": "new-product-id",
    "name": "Test Ring",
    "price": 5000,
    "isActive": true
  }
}
```

✅ **Result:** PASS / FAIL

---

### TEST 11: Admin - Update Product

**Test:** Admin can update product visibility

```bash
curl -X PUT https://orashop-api.onrender.com/api/admin/products/[product-id] \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [admin-token]" \
  -d '{
    "isActive": false
  }'

# Expected output:
{
  "success": true,
  "product": {
    "isActive": false
  }
}
```

✅ **Result:** PASS / FAIL

---

### TEST 12: Admin - Upload Image

**Test:** Admin can upload product image

```
1. Go to admin dashboard
2. Select product
3. Click "Upload Image"
4. Select image file
5. Verify upload succeeds
6. Verify image appears in Supabase storage
7. Verify image URL returned
```

**Expected:**
```
✓ Upload completes in < 5 seconds
✓ Image appears in Supabase Storage bucket
✓ Public URL works
✓ Image displays on product page
```

✅ **Result:** PASS / FAIL

---

### TEST 13: Cart Functionality

**Test:** Add to cart works correctly

```
1. Go to: https://orashop.com/collections
2. Click on a product
3. Click "Add to Cart"
4. Verify cart count increases
5. Go to: https://orashop.com/cart
6. Verify product appears in cart
7. Try adjusting quantity
8. Try removing product
```

**Expected:**
```
✓ Cart count updates
✓ Product appears in cart page
✓ Quantity can be changed
✓ Remove works correctly
```

✅ **Result:** PASS / FAIL

---

### TEST 14: Checkout - Payment Flow (Test Mode)

**Test:** Checkout initiates payment

```
1. Go to cart: https://orashop.com/cart
2. Add product
3. Click "Checkout"
4. Fill shipping address
5. Click "Proceed to Payment"
6. Razorpay modal should appear
7. Use test card: 4111111111111111
8. Use any expiry: 12/25
9. Use any CVV: 123
10. Click "Pay"
```

**Expected:**
```
✓ Checkout page loads
✓ Razorpay modal appears
✓ Payment test succeeds
✓ Order created in database
✓ Confirmation email sent (optional)
```

✅ **Result:** PASS / FAIL

---

### TEST 15: Database - Product Visibility Rule

**Test:** Inactive products don't appear in collections

```bash
# In Supabase SQL Editor:
SELECT COUNT(*) FROM products WHERE is_active = true;
# Result: Should match products shown in collections page

SELECT COUNT(*) FROM products WHERE is_active = false;
# These should NOT appear on collections page
```

✅ **Result:** PASS / FAIL

---

### TEST 16: Security - JWT Token Validation

**Test:** Requests without valid token are rejected

```bash
# Try accessing admin endpoint without token:
curl https://orashop-api.onrender.com/api/admin/products \
  -H "Authorization: Bearer invalid-token"

# Expected output:
{
  "success": false,
  "error": "Unauthorized"
}
```

✅ **Result:** PASS / FAIL

---

### TEST 17: CORS - Cross-Origin Requests

**Test:** Frontend can make requests to backend

```bash
# In browser console on https://orashop.com:
fetch('https://orashop-api.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log('Success:', d))
  .catch(e => console.log('Error:', e))
```

**Expected:**
```
✓ No CORS error
✓ Data returned successfully
✓ Console shows "Success: {...}"
```

✅ **Result:** PASS / FAIL

---

### TEST 18: SSL/HTTPS - Security

**Test:** Site uses HTTPS

```
1. Go to: https://orashop.com
2. Click lock icon in address bar
3. Verify "Connection is secure"
4. Certificate should be valid
5. No "Not Secure" warnings
```

**Expected:**
```
✓ HTTPS enabled
✓ Valid SSL certificate
✓ Green lock icon visible
✓ No mixed content warnings
```

✅ **Result:** PASS / FAIL

---

### TEST 19: Performance - Lighthouse Score

**Test:** Performance meets quality standards

```
1. Go to: https://orashop.com/collections
2. Open DevTools (F12)
3. Go to "Lighthouse" tab
4. Click "Generate report"
5. Wait for analysis
6. Check scores:
   - Performance: > 80
   - Accessibility: > 80
   - Best Practices: > 80
   - SEO: > 80
```

**Expected:**
```
✓ Performance > 80
✓ Accessibility > 80
✓ No critical issues
✓ Load time < 3 seconds
```

✅ **Result:** PASS / FAIL

---

### TEST 20: Mobile Responsiveness

**Test:** Site works on mobile devices

```
1. Go to: https://orashop.com/collections
2. Open DevTools (F12)
3. Click device toggle (mobile icon)
4. Select iPhone 12
5. Verify layout looks correct
6. Test touch interactions:
   - Click buttons
   - Scroll through products
   - Filter by category
   - Open product details
```

**Expected:**
```
✓ Layout responsive on mobile
✓ Images scale correctly
✓ Buttons are clickable
✓ No horizontal scroll
✓ Text readable (16px+ font)
```

✅ **Result:** PASS / FAIL

---

## 📋 SMOKE TEST SUMMARY

Create a test results document:

```markdown
# SMOKE TEST RESULTS - JANUARY 25, 2026

## API Tests
- [ ] Health Check: PASS/FAIL
- [ ] Products Endpoint: PASS/FAIL
- [ ] Categories Endpoint: PASS/FAIL

## Frontend Tests
- [ ] Collections Page Load: PASS/FAIL
- [ ] Display All Products: PASS/FAIL
- [ ] Category Filter: PASS/FAIL
- [ ] Image Loading: PASS/FAIL
- [ ] Search/Sort: PASS/FAIL

## Admin Tests
- [ ] Login: PASS/FAIL
- [ ] Create Product: PASS/FAIL
- [ ] Update Product: PASS/FAIL
- [ ] Upload Image: PASS/FAIL

## User Flow Tests
- [ ] Add to Cart: PASS/FAIL
- [ ] Checkout: PASS/FAIL
- [ ] Payment: PASS/FAIL

## Security Tests
- [ ] JWT Validation: PASS/FAIL
- [ ] CORS: PASS/FAIL
- [ ] HTTPS: PASS/FAIL

## Performance Tests
- [ ] Lighthouse Score: [__/100]
- [ ] Mobile Responsiveness: PASS/FAIL

## Summary
Total Tests: 20
Passed: __
Failed: __
Success Rate: __%

Status: ✅ READY FOR LAUNCH / ❌ NEEDS FIXES
```

---

## 🚨 TROUBLESHOOTING

### Issue: Test 2 fails - "Cannot reach API"

**Solution:**
```
1. Check backend is deployed and running
2. Verify API URL is correct
3. Check CORS headers in response
4. Verify network connectivity
```

### Issue: Test 4 fails - "Page won't load"

**Solution:**
```
1. Check frontend deployed to Vercel
2. Verify NEXT_PUBLIC_API_URL is set
3. Check build completed successfully
4. Clear browser cache (Ctrl+Shift+Delete)
```

### Issue: Test 7 fails - "Images not loading"

**Solution:**
```
1. Check Supabase storage bucket is public
2. Verify image URLs are correct format
3. Check image file exists in bucket
4. Test URL directly in browser
```

### Issue: Test 14 fails - "Razorpay modal won't appear"

**Solution:**
```
1. Verify NEXT_PUBLIC_RAZORPAY_KEY is set
2. Use TEST key (rzp_test_*), not LIVE key
3. Check Razorpay account is active
4. Verify API is returning correct data
```

---

## ✅ PHASE 4 COMPLETION CHECKLIST

- [ ] All 20 smoke tests executed
- [ ] 18+ tests passing (90%+ success rate)
- [ ] No critical errors
- [ ] Collections page fully functional
- [ ] Images loading correctly
- [ ] Admin functions working
- [ ] Payment flow tested
- [ ] Performance acceptable (Lighthouse > 75)
- [ ] Mobile responsive
- [ ] Security checks passed
- [ ] Test results document created

**Phase 4 Status:** ✅ COMPLETE when all items are checked

---

## 📞 NEXT STEPS

If all tests pass:

✅ **READY FOR LAUNCH!**

If issues found:
- Fix and re-run failing tests
- Reference troubleshooting guide above
- Check deployment logs for errors

---

## 📝 LAUNCH SIGN-OFF

```
Production Smoke Test - COMPLETE ✅

Date: January 25, 2026
Tests Executed: 20
Tests Passed: __ / 20
Success Rate: __%
Critical Issues: None

✅ APPROVED FOR PRODUCTION LAUNCH

Signed:
Date:
```

---

**Phase 4 Status:** ✅ READY TO EXECUTE

Start testing now!
