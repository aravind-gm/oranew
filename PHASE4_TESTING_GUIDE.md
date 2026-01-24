# 🧪 PHASE 4.2 TESTING & VERIFICATION GUIDE

**Purpose**: Validate that Supabase fixes are working correctly  
**Estimated Time**: 15 minutes  
**Prerequisites**: Phase 4.2 SQL fixes applied

---

## 🚀 QUICK START TESTS

### TEST 1: Admin Product Creation (3 min)

**Objective**: Verify admin can create products after RLS fixes

**Steps**:
1. Open admin panel: `http://localhost:3000/admin`
2. Log in with admin credentials
3. Navigate to Products → Create Product
4. Fill form:
   ```
   Product Name: "Test Basic Product"
   Price: 999
   Category: Select any category
   Stock: 50
   Description: "Testing RLS fixes"
   ```
5. Click **Create Product**

**Expected Result** ✅:
```
✅ Product created successfully
✅ No permission errors
✅ Product appears in product list
✅ Toast notification shows success
```

**If Failed** ❌:
```
Error: "Permission denied" or "RLS policy violation"
→ Check: RLS policies were created (Step 3)
→ Check: Service role key in backend/.env

Error: "Not authenticated" (401)
→ Check: JWT token is valid
→ Check: Token attached to request (Phase 3 fix)
```

---

### TEST 2: Image Upload (4 min)

**Objective**: Verify images can be uploaded to storage

**Steps**:
1. From TEST 1, continue with the created product
2. Go to product → Edit
3. Click **Add Images** section
4. Select a test image from your computer
5. Click **Upload** button
6. Wait for upload to complete

**Expected Result** ✅:
```
✅ Image upload succeeds
✅ Progress bar completes
✅ Public URL is generated
✅ Image preview shows
✅ Success message appears
```

**If Failed** ❌:
```
Error: "Storage not configured"
→ Check: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env

Error: "Permission denied on bucket"
→ Check: Storage policy was created (Step 5)

Error: "File too large" or "Invalid format"
→ Use smaller JPG/PNG file
```

---

### TEST 3: Public Image Access (4 min)

**Objective**: Verify customers can view uploaded images

**Steps**:
1. Open public storefront: `http://localhost:3000`
2. Search for "Test Basic Product" (from TEST 1)
3. Click on product to view details
4. Check if image displays

**Expected Result** ✅:
```
✅ Product loads
✅ Image displays without errors
✅ Image URL is valid (check DevTools Network tab)
✅ No 403/404 errors in console
✅ Image is publicly accessible
```

**If Failed** ❌:
```
Error: 404 Not Found (image missing)
→ Check: File was actually uploaded (TEST 2)
→ Check: Bucket name is exactly 'product-images'

Error: 403 Forbidden (permission denied)
→ Check: Public read policy exists
→ Check: Storage policy syntax

Error: Image loads but is broken
→ Check: Image file is not corrupted
→ Try with different image format (JPG/PNG)
```

---

### TEST 4: Admin Inventory Update (3 min)

**Objective**: Verify admin can update product inventory

**Steps**:
1. From admin panel: Products → Find "Test Basic Product"
2. Click **Edit Inventory**
3. Change stock quantity: 50 → 75
4. Click **Save**

**Expected Result** ✅:
```
✅ Inventory updated
✅ No permission errors
✅ Change is reflected immediately
✅ Success message shows
```

**If Failed** ❌:
```
Error: "RLS policy violation"
→ Check: inventory_locks table RLS policy (Step 3)

Error: "Foreign key constraint"
→ Check: Product exists and is not deleted
```

---

## 📊 COMPREHENSIVE TEST SUITE

### Database Operations

| Operation | Command | Expected | Status |
|-----------|---------|----------|--------|
| Create Category | POST /api/admin/categories | 201 Success | ✅ |
| Read Category | GET /api/categories | 200 + Data | ✅ |
| Update Category | PUT /api/admin/categories/1 | 200 Success | ✅ |
| Delete Category | DELETE /api/admin/categories/1 | 204 Success | ✅ |
| Create Product | POST /api/admin/products | 201 Success | ⏳ |
| Read Product | GET /api/products | 200 + Data | ⏳ |
| Update Product | PUT /api/admin/products/1 | 200 Success | ⏳ |
| Delete Product | DELETE /api/admin/products/1 | 204 Success | ⏳ |

### Storage Operations

| Operation | Expected | Status |
|-----------|----------|--------|
| Upload Image | 200 + public URL | ⏳ |
| Public Read Image | 200 + image data | ⏳ |
| Delete Image | 204 Success | ⏳ |

### API Security

| Check | Expected | Status |
|-------|----------|--------|
| No JWT → admin endpoint | 401 Unauthorized | ✅ |
| Invalid JWT → any endpoint | 401 Unauthorized | ✅ |
| Customer JWT → admin endpoint | 403 Forbidden | ✅ |
| Admin JWT → admin endpoint | 200/201 Success | ⏳ |

---

## 🔍 DETAILED INSPECTION TESTS

### TEST 5: Network Inspection (3 min)

**Objective**: Verify API calls and storage URLs are correct

**Steps**:
1. Open browser DevTools: **F12**
2. Go to **Network** tab
3. Go to public product view
4. Find image request in Network tab
5. Check URL and response

**Expected URL Format**:
```
https://[project-id].supabase.co/storage/v1/object/public/product-images/[filename]
```

**Expected Response**:
```
Status: 200 OK
Content-Type: image/jpeg or image/png
Content-Length: [image size]
```

**What to look for**:
- ✅ 200 response (success)
- ❌ 403 response (permission denied → check storage policy)
- ❌ 404 response (file not found → check upload)

---

### TEST 6: Backend Logs Inspection (2 min)

**Objective**: Verify backend is processing requests correctly

**Steps**:
1. Open terminal running backend
2. Create a product via admin panel
3. Watch backend logs for messages

**Expected Logs**:
```
[Product Controller] 📝 Creating product...
[Product Controller] ✅ Validation passed...
[Product Controller] ✅ PRODUCT CREATED SUCCESSFULLY
```

**Look for errors**:
```
[Supabase Storage] 🔴 STORAGE ERROR
[Product Controller] ❌ CREATION FAILED
[Upload Controller] ❌ UPLOAD REQUEST FAILED
```

If errors appear → Screenshot and troubleshoot

---

### TEST 7: Database Direct Query (2 min)

**Objective**: Verify data is actually in database

**Steps**:
1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Paste and run:

```sql
-- Check if test product exists
SELECT id, name, price, created_at 
FROM products 
WHERE name = 'Test Basic Product'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result**:
```
id       | name                 | price | created_at
---------+----------------------+-------+-------------------
abc123   | Test Basic Product   | 999   | 2026-01-24 10:30
```

**If no results**:
- Product was not actually created in database
- Check backend error logs
- Check RLS policies

---

### TEST 8: Storage Direct Check (2 min)

**Objective**: Verify image files are in storage bucket

**Steps**:
1. Open Supabase Dashboard
2. Go to **Storage** → **product-images**
3. Look for uploaded images
4. Click image → check **Access** (should be public)

**Expected**:
```
✅ Images visible in bucket
✅ Files have correct names
✅ File sizes match uploaded size
✅ Access is "Public"
```

**If missing or private**:
- Upload didn't actually complete
- Rerun TEST 2 (image upload)

---

## 📋 FULL TEST MATRIX

### All Tests to Run

```
QUICK TESTS (10 min):
├─ TEST 1: Admin Product Creation (3 min) ✅
├─ TEST 2: Image Upload (4 min) ⏳
└─ TEST 3: Public Image Access (3 min) ⏳

VERIFICATION TESTS (10 min):
├─ TEST 4: Inventory Update (3 min) ⏳
├─ TEST 5: Network Inspection (3 min) ⏳
├─ TEST 6: Backend Logs (2 min) ⏳
├─ TEST 7: Database Query (2 min) ⏳
└─ TEST 8: Storage Check (2 min) ⏳

TOTAL TIME: ~20 minutes
ALL TESTS PASSING = Phase 4.2 Complete ✅
```

---

## ✅ SUCCESS CRITERIA

Phase 4.2 is complete when:

1. ✅ TEST 1 PASSES: Admin can create products
2. ✅ TEST 2 PASSES: Images upload successfully
3. ✅ TEST 3 PASSES: Images display publicly
4. ✅ TEST 4 PASSES: Inventory updates work
5. ✅ TEST 5 PASSES: Network calls are correct
6. ✅ TEST 6 PASSES: Backend logs show success
7. ✅ TEST 7 PASSES: Data exists in database
8. ✅ TEST 8 PASSES: Files exist in storage

---

## 🐛 DEBUGGING GUIDE

### If TEST 1 Fails (Product Creation)

```
Error: 401 Unauthorized
└─ Fix: Check JWT token (Phase 3 fix)
   - Verify localStorage has 'ora_token'
   - Verify token is attached to request (DevTools Network)

Error: 403 Forbidden
└─ Fix: Check role is ADMIN/STAFF
   - Verify authorize middleware sees correct role
   - Check backend logs for role info

Error: 500 Internal Server Error
└─ Fix: Check backend logs
   - Look for specific error message
   - Check database connectivity
   - Check RLS policies
```

### If TEST 2 Fails (Image Upload)

```
Error: 403 Forbidden
└─ Fix: Check storage service role key
   - Verify SUPABASE_SERVICE_ROLE_KEY in backend/.env
   - Verify it's the correct key (not anon key)

Error: 404 Not Found
└─ Fix: Check bucket name
   - Verify bucket is 'product-images' (exact name)
   - Check bucket exists in Supabase

Error: 413 Payload Too Large
└─ Fix: Use smaller image
   - Resize image to < 10MB
   - Use JPEG/PNG format
```

### If TEST 3 Fails (Image Display)

```
Error: 403 Forbidden
└─ Fix: Create storage policy
   - Run STEP 5 from implementation checklist
   - Verify policy syntax

Error: 404 Not Found
└─ Fix: Check image was uploaded
   - Re-run TEST 2
   - Check Supabase Storage bucket
   - Verify filename matches URL

Error: Image broken/corrupted
└─ Fix: Re-upload image
   - Original file may be corrupted
   - Try with different image file
```

---

## 📞 QUICK FIX REFERENCE

**Most Common Issues**:

| Issue | Fix |
|-------|-----|
| 403 on image read | Create storage policy (STEP 5) |
| 401 on product create | Check JWT token (Phase 3) |
| 403 on product create | Check RLS policies (STEP 3) |
| Image doesn't upload | Check SUPABASE_SERVICE_ROLE_KEY |
| Storage policy already exists | That's OK, continue testing |

---

## 📝 TEST EXECUTION LOG

**Date**: ________________  
**Tester**: ________________

**Quick Tests Results**:
- [ ] TEST 1: PASS / FAIL
- [ ] TEST 2: PASS / FAIL
- [ ] TEST 3: PASS / FAIL

**Verification Tests Results**:
- [ ] TEST 4: PASS / FAIL
- [ ] TEST 5: PASS / FAIL
- [ ] TEST 6: PASS / FAIL
- [ ] TEST 7: PASS / FAIL
- [ ] TEST 8: PASS / FAIL

**Overall Status**: ________________  
**Issues Found**: ________________  
**Resolution**: ________________

---

**After all tests pass**: Phase 4.2 is officially COMPLETE ✅

Next step: Full platform testing and feature expansion

---

Generated: Phase 4.2 Testing Guide  
Status: Ready to Execute
