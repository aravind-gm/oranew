-- SUPABASE RLS POLICIES FOR VERCEL SERVERLESS ARCHITECTURE
-- Execute in Supabase SQL Editor
-- Run this script AFTER creating tables in Prisma

-- ============================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTS TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Anyone can READ active products
CREATE POLICY products_public_read
ON products FOR SELECT
USING (is_active = true);

-- Policy 2: Only ADMIN can CREATE products (via JWT)
CREATE POLICY products_admin_create
ON products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- Policy 3: Only ADMIN can UPDATE products
CREATE POLICY products_admin_update
ON products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- Policy 4: Only ADMIN can DELETE products
CREATE POLICY products_admin_delete
ON products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================
-- CATEGORIES TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Anyone can READ active categories
CREATE POLICY categories_public_read
ON categories FOR SELECT
USING (is_active = true);

-- Policy 2: Only ADMIN can CREATE/UPDATE/DELETE
CREATE POLICY categories_admin_write
ON categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================
-- PRODUCT IMAGES TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Anyone can READ product images (public products)
CREATE POLICY product_images_public_read
ON product_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_images.product_id
    AND products.is_active = true
  )
);

-- Policy 2: Only ADMIN can UPLOAD/DELETE images
CREATE POLICY product_images_admin_write
ON product_images FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================
-- ORDERS TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Users can READ their own orders
CREATE POLICY orders_user_read
ON orders FOR SELECT
USING (
  (SELECT auth.uid()) = (
    SELECT id FROM users WHERE email = orders.email LIMIT 1
  )
);

-- Policy 2: ADMIN can READ all orders
CREATE POLICY orders_admin_read
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- Policy 3: Anyone (logged in) can CREATE orders
CREATE POLICY orders_create
ON orders FOR INSERT
WITH CHECK (true);

-- Policy 4: Only ADMIN can UPDATE orders
CREATE POLICY orders_admin_update
ON orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================
-- ORDER ITEMS TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Users can READ order items for their orders
CREATE POLICY order_items_user_read
ON order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND (
      (SELECT auth.uid()) = (
        SELECT id FROM users WHERE email = orders.email LIMIT 1
      )
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'ADMIN'
      )
    )
  )
);

-- Policy 2: Anyone can CREATE order items
CREATE POLICY order_items_create
ON order_items FOR INSERT
WITH CHECK (true);

-- ============================================
-- USERS TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Users can READ their own profile
CREATE POLICY users_self_read
ON users FOR SELECT
USING (
  (SELECT auth.uid()) = id
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- Policy 2: Only ADMIN can CREATE/UPDATE/DELETE users
CREATE POLICY users_admin_write
ON users FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================
-- REVIEWS TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Anyone can READ approved reviews
CREATE POLICY reviews_public_read
ON reviews FOR SELECT
USING (is_approved = true);

-- Policy 2: Authenticated users can CREATE reviews
CREATE POLICY reviews_user_create
ON reviews FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = user_id
);

-- Policy 3: Users can UPDATE their own reviews
CREATE POLICY reviews_user_update
ON reviews FOR UPDATE
USING (
  (SELECT auth.uid()) = user_id
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
);

-- Policy 4: Only ADMIN can APPROVE/DELETE reviews
CREATE POLICY reviews_admin_manage
ON reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================
-- WISHLISTS TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Users can READ their own wishlists
CREATE POLICY wishlists_user_read
ON wishlists FOR SELECT
USING (
  (SELECT auth.uid()) = user_id
);

-- Policy 2: Users can CREATE/UPDATE/DELETE their own wishlists
CREATE POLICY wishlists_user_write
ON wishlists FOR ALL
USING (
  (SELECT auth.uid()) = user_id
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
);

-- ============================================
-- COUPONS TABLE - RLS POLICIES
-- ============================================

-- Policy 1: Anyone can READ active coupons
CREATE POLICY coupons_public_read
ON coupons FOR SELECT
USING (is_active = true);

-- Policy 2: Only ADMIN can CREATE/UPDATE/DELETE
CREATE POLICY coupons_admin_write
ON coupons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ADMIN'
  )
);

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

-- Run this query to verify all tables have RLS enabled:
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname='public' 
-- AND rowsecurity = true;
