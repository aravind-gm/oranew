# ✅ PHASE 4.2 IMPLEMENTATION CHECKLIST

**Status**: Ready to Execute  
**Estimated Time**: 20 minutes  
**Risk Level**: LOW

---

## 📋 STEP-BY-STEP IMPLEMENTATION

### STEP 1: Access Supabase Dashboard (2 min)

- [ ] Go to https://supabase.com/dashboard
- [ ] Log in to your account
- [ ] Click project **"orashop"** (or your project name)
- [ ] Wait for dashboard to load
- [ ] Verify you can see: **Database**, **Storage**, **SQL Editor** in sidebar

**Verify**: You see your project dashboard with tables listed

---

### STEP 2: Run RLS Verification Query (3 min)

- [ ] Click **SQL Editor** in left sidebar
- [ ] Click **New Query** (or ⊕ button)
- [ ] Paste this query:

```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled?"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'products', 
    'product_images', 
    'users', 
    'orders', 
    'categories',
    'inventory_locks'
  )
ORDER BY tablename;
```

- [ ] Click **Run** (▶ button)
- [ ] **Record results** in next section

**Expected Results**:
```
tablename        | RLS Enabled?
-----------------+-----------
categories       | false/true
inventory_locks  | false/true
orders           | false/true
product_images   | false/true
products         | false/true
users            | false/true
```

**What to do next**:
- If ALL show `false` → Skip STEP 3, go to STEP 4
- If ANY show `true` → Complete STEP 3

---

### STEP 3: Create Service Role Policies (5 min) — ONLY IF RLS ENABLED

If previous step showed `rowsecurity = true`, run these:

- [ ] Click **SQL Editor** → **New Query**
- [ ] Paste entire policy creation SQL from [PHASE4_SUPABASE_SQL_MIGRATIONS.sql](PHASE4_SUPABASE_SQL_MIGRATIONS.sql)
  - Section: "STEP 2: IF RLS IS ENABLED..."
  - Copy all CREATE POLICY statements
- [ ] Click **Run**
- [ ] Wait for completion (should say "Success")

**Expected Output**:
```
✅ Success: 8 rows affected
```

**What happened**: Granted service role full access to 8 tables

---

### STEP 4: Check Storage Policies (3 min)

- [ ] Click **SQL Editor** → **New Query**
- [ ] Paste this query:

```sql
-- Check if product-images bucket has public read policy
SELECT 
  policyname,
  tablename,
  qual as "USING clause"
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

- [ ] Click **Run**
- [ ] **Record results**

**Expected Results**:
```
policyname                      | tablename | USING clause
--------------------------------+-----------+---------------------------
Public Read Access              | objects   | bucket_id = 'product-images'
(or similar public read policy) |           |
```

**What to do next**:
- If you see public read policy → Go to STEP 6
- If NO public read policy → Complete STEP 5

---

### STEP 5: Create Storage Public Read Policy (3 min) — ONLY IF MISSING

If previous step showed NO public read policy:

- [ ] Click **SQL Editor** → **New Query**
- [ ] Paste this query:

```sql
-- Enable public read access on product-images bucket
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
```

- [ ] Click **Run**
- [ ] Wait for completion

**Expected Output**:
```
✅ Success: 1 row affected
```

**What happened**: Enabled public read access to product images

---

### STEP 6: Verify All Policies (2 min)

- [ ] Click **SQL Editor** → **New Query**
- [ ] Paste this query:

```sql
-- Verify all storage policies
SELECT 
  policyname,
  roles,
  (SELECT COUNT(*) FROM pg_policies 
   WHERE schemaname = 'storage' AND tablename = 'objects') as total_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
```

- [ ] Click **Run**

**Expected Output**:
```
✅ At least 1 policy row returned
At least 1 policy for product-images bucket
```

**Verify**: You see "Public Read Access" or similar policy

---

### STEP 7: Test Admin Panel (5 min)

- [ ] Go to your application admin panel (http://localhost:3000/admin or deployed URL)
- [ ] Log in with admin credentials
- [ ] Click **Create Product** (or Products menu)
- [ ] Fill in form:
  - Product Name: "Test Product"
  - Price: 999
  - Category: (select any)
  - Stock: 10
  - Image: (upload test image if possible)
- [ ] Click **Create** button

**Expected Result**:
```
✅ Success: Product created
Image uploaded (if included)
Product visible in product list
```

**If error occurs**:
- Note exact error message
- Check browser console (F12 → Console tab)
- Check backend logs

---

### STEP 8: Test Public Product View (3 min)

- [ ] Go to public store (http://localhost:3000 or deployed URL)
- [ ] Search for "Test Product" you just created
- [ ] Click on product

**Expected Result**:
```
✅ Product displays
✅ Image loads (if uploaded)
✅ No 403/404 errors
✅ Price shows correctly
```

**If images don't load**:
- Open browser DevTools (F12)
- Check Network tab
- Look for image URL
- Verify URL format: https://[project].supabase.co/storage/v1/object/public/product-images/...

---

## 📊 CHECKLIST SUMMARY

### Phase 4.2 Tasks

- [ ] Access Supabase Dashboard
- [ ] Run RLS verification query
- [ ] If RLS enabled: Create service role policies
- [ ] Check storage policies
- [ ] If missing: Create public read policy
- [ ] Verify all policies are in place
- [ ] Test admin product creation
- [ ] Test public product view with image

**All items checked?** → Phase 4.2 is COMPLETE ✅

---

## 🆘 TROUBLESHOOTING

### Issue: "Permission denied" error in SQL Editor

**Solution**:
- Ensure you're using a service role or admin account
- Try signing out and back in
- Check if account has admin privileges

### Issue: Product creation fails with 401/403

**Solution**:
- Verify JWT token is valid
- Check backend logs for auth errors
- Confirm SUPABASE_SERVICE_ROLE_KEY is set in backend/.env

### Issue: Images don't load (404 error)

**Solution**:
- Verify storage policy was created
- Check bucket name is exactly: `product-images`
- Verify public read policy exists
- Clear browser cache

### Issue: "Policy already exists" error

**Solution**:
- This is OK — policy already created previously
- Continue to verification step

### Issue: Database says "RLS enabled" but policies missing

**Solution**:
- Run Step 3 (create service role policies)
- This grants authenticated role full access
- Backend requests use authenticated connection

---

## ✅ SUCCESS INDICATORS

**Phase 4.2 is complete when**:

1. ✅ Supabase dashboard shows storage policies
2. ✅ Database RLS verified (or service role policies created)
3. ✅ Admin can create product
4. ✅ Product images upload successfully
5. ✅ Public product view loads image
6. ✅ No 403/404 errors on image access
7. ✅ Inventory updates work
8. ✅ Order operations work

---

## 📝 COMPLETION RECORD

**Date Completed**: ________________  
**Time Taken**: ________________  
**Issues Encountered**: ________________  
**Resolution**: ________________  

---

## 🎯 NEXT PHASE

After Phase 4.2 is complete:

1. Test complete product creation flow
2. Test order management
3. Test inventory operations
4. Performance testing
5. Security audit

---

**Phase 4.2 is the final major stabilization phase.**  
After completion, the platform should be fully functional.

---

## 📞 QUICK REFERENCE

**Supabase URL**: https://supabase.com/dashboard  
**SQL Editor**: Dashboard > SQL Editor  
**Storage Settings**: Dashboard > Storage > product-images  
**Key File**: [PHASE4_SUPABASE_SQL_MIGRATIONS.sql](PHASE4_SUPABASE_SQL_MIGRATIONS.sql)

**Most Common Fix**:
```sql
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
```

**If RLS Enabled** → Run Step 3 policies from migration file

---

**Status**: Ready for Implementation  
**Complexity**: LOW  
**Time to Complete**: ~20 minutes  
**Risk**: LOW (read policies only)
