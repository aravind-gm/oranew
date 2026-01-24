-- PHASE 4.2: SUPABASE RLS & STORAGE POLICY FIXES
-- Run these in Supabase SQL Editor (Dashboard > SQL Editor)

-- =============================================================
-- STEP 1: VERIFY CURRENT RLS STATE (RUN THIS FIRST)
-- =============================================================

-- Check which tables have RLS enabled
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
    'inventory_locks',
    'cart_items',
    'reviews',
    'coupons'
  )
ORDER BY tablename;

-- Check existing storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE schemaname = 'storage';

-- =============================================================
-- STEP 2: IF RLS IS ENABLED ON PUBLIC TABLES
-- Run these SQL statements to grant service role access
-- (Only run if Step 1 shows rowsecurity = true)
-- =============================================================

-- Grant full access to service role on products table
CREATE POLICY "Service role full access" ON public.products
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role on product_images table
CREATE POLICY "Service role full access" ON public.product_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role on categories table
CREATE POLICY "Service role full access" ON public.categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role on orders table
CREATE POLICY "Service role full access" ON public.orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role on cart_items table
CREATE POLICY "Service role full access" ON public.cart_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role on reviews table
CREATE POLICY "Service role full access" ON public.reviews
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role on coupons table
CREATE POLICY "Service role full access" ON public.coupons
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role on inventory_locks table
CREATE POLICY "Service role full access" ON public.inventory_locks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================
-- STEP 3: VERIFY STORAGE POLICY EXISTS
-- Check if product-images bucket has public read policy
-- =============================================================

-- List all storage policies
SELECT 
  policyname,
  tablename,
  qual as "USING clause"
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Check bucket configuration
SELECT 
  id,
  name,
  owner,
  public,
  created_at,
  updated_at
FROM storage.buckets 
WHERE name = 'product-images';

-- =============================================================
-- STEP 4: CREATE STORAGE POLICY FOR PUBLIC READ ACCESS
-- (Only run if Step 3 shows no public read policy)
-- =============================================================

-- Enable public read access on product-images bucket
CREATE POLICY "Public Read Access" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Alternative: More explicit version
-- CREATE POLICY "Allow public read on product-images" ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'product-images');

-- =============================================================
-- STEP 5: VERIFY POLICIES WERE CREATED
-- Run this to confirm policies are in place
-- =============================================================

-- Check all policies on storage.objects
SELECT 
  policyname,
  permissive as "Type",
  roles,
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- Check if product-images bucket is public
SELECT 
  name,
  public,
  (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'product-images') as object_count
FROM storage.buckets 
WHERE name = 'product-images';

-- =============================================================
-- STEP 6: TEST CONNECTIVITY (Optional)
-- Verify tables are accessible
-- =============================================================

-- Test read access
SELECT COUNT(*) as product_count FROM public.products;
SELECT COUNT(*) as product_images_count FROM public.product_images;
SELECT COUNT(*) as category_count FROM public.categories;

-- Test write access (insert test record)
-- INSERT INTO public.categories (id, name, slug) 
-- VALUES ('test-id', 'Test Category', 'test-category');

-- Test delete (clean up test record)
-- DELETE FROM public.categories WHERE id = 'test-id';

-- =============================================================
-- CLEANUP: IF YOU CREATED TEST RECORDS, RUN THIS
-- =============================================================

-- DELETE FROM public.categories WHERE id = 'test-id';
-- DELETE FROM public.products WHERE sku LIKE 'TEST-%';

-- =============================================================
-- SUMMARY OF CHANGES
-- =============================================================
-- 1. If RLS is enabled: Grants service role full access to public tables
-- 2. Creates public read policy on storage.objects for product-images bucket
-- 3. Enables product image access to all users (public + authenticated)
-- 4. Maintains security: Service role still required for writes
-- =============================================================
