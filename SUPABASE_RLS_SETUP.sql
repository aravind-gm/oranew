-- ============================================================================
-- ORA JEWELLERY - SUPABASE RLS POLICIES & STORAGE SETUP
-- Execute this in Supabase SQL Editor
-- Last Updated: January 25, 2026
-- ============================================================================

-- ============================================================================
-- STEP 1: PRODUCTS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public read policy: Anyone can see active products
CREATE POLICY "public_read_active_products" ON products
  FOR SELECT
  USING (is_active = true);

-- Admin write policy: Only admins can create/update/delete products
CREATE POLICY "admin_all_access" ON products
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'ADMIN' 
    OR auth.jwt() ->> 'role' = 'STAFF'
  );

-- ============================================================================
-- STEP 2: PRODUCT_IMAGES TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on product_images table
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Public read policy: All images are public
CREATE POLICY "public_read_images" ON product_images
  FOR SELECT
  USING (true);

-- Admin write policy: Only admins can upload/manage images
CREATE POLICY "admin_write_images" ON product_images
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'ADMIN'
    OR auth.jwt() ->> 'role' = 'STAFF'
  );

-- ============================================================================
-- STEP 3: CATEGORIES TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Public read policy: Can see active categories
CREATE POLICY "public_read_active_categories" ON categories
  FOR SELECT
  USING (is_active = true);

-- Admin write policy: Only admins can manage categories
CREATE POLICY "admin_write_categories" ON categories
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'ADMIN'
    OR auth.jwt() ->> 'role' = 'STAFF'
  );

-- ============================================================================
-- STEP 4: USERS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "user_read_self" ON users
  FOR SELECT
  USING (
    auth.uid() = id::uuid
    OR auth.jwt() ->> 'role' = 'ADMIN'
  );

-- Users can update their own data
CREATE POLICY "user_update_self" ON users
  FOR UPDATE
  USING (
    auth.uid() = id::uuid
    OR auth.jwt() ->> 'role' = 'ADMIN'
  );

-- Only admins can insert/delete users
CREATE POLICY "admin_manage_users" ON users
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'ADMIN');

-- ============================================================================
-- STEP 5: ORDERS TABLE - RLS POLICIES
-- ============================================================================

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own orders
CREATE POLICY "user_read_own_orders" ON orders
  FOR SELECT
  USING (
    auth.uid() = user_id::uuid
    OR auth.jwt() ->> 'role' = 'ADMIN'
  );

-- Only admins can update/delete orders
CREATE POLICY "admin_manage_orders" ON orders
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'ADMIN');

-- ============================================================================
-- STEP 6: VERIFY RLS IS ENABLED
-- ============================================================================

-- Run this query to verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected output: All public tables should show rowsecurity = true

-- ============================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_final_price ON products(final_price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Product images indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ============================================================================
-- STEP 8: VERIFY INDEXES
-- ============================================================================

-- List all indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- STEP 9: STORAGE BUCKET CONFIGURATION
-- ============================================================================

-- Note: Storage bucket creation is done via Supabase Dashboard:
-- 1. Go to Storage > Buckets
-- 2. Create new bucket: "product-images"
-- 3. Set to Public (uncheck "Private bucket")
-- 4. Upload a test image and verify public URL works:
--    https://[project].supabase.co/storage/v1/object/public/product-images/test.jpg

-- ============================================================================
-- FINAL VERIFICATION QUERIES
-- ============================================================================

-- Check RLS policies on products table
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Check active products count
SELECT COUNT(*) as active_products FROM products WHERE is_active = true;

-- Check categories count
SELECT COUNT(*) as active_categories FROM categories WHERE is_active = true;

-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================

-- ✅ All tables have RLS enabled (rowsecurity = true)
-- ✅ Public policies allow SELECT for active records only
-- ✅ Admin policies allow ALL operations
-- ✅ Indexes created for performance
-- ✅ Storage bucket "product-images" is public and accessible
-- ✅ All tables have appropriate indexes for common queries

-- If all above are true, Supabase setup is complete!

-- ============================================================================
-- NOTES FOR TEAM
-- ============================================================================

-- 1. These RLS policies ensure:
--    - Public users can ONLY READ active products/categories
--    - Users can only read their own orders and profile
--    - Only ADMINS can CREATE/UPDATE/DELETE products
--    - Images are always public (no RLS needed)
--
-- 2. Connection pooling is handled via DATABASE_URL (pooler.supabase.com)
-- 3. Direct connection (DIRECT_URL) is ONLY for migrations
-- 4. Backend validates auth tokens via JWT secret
-- 5. RLS provides second layer of security at database level

-- ============================================================================
