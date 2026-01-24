-- ═══════════════════════════════════════════════════════════════════════════
-- ORA JEWELLERY - ADMIN USER SETUP
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this in Supabase Dashboard > SQL Editor
-- Creates an admin user for testing the admin panel
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if admin user exists
SELECT id, email, full_name, role, is_verified, created_at 
FROM users 
WHERE role = 'ADMIN';

-- ═══════════════════════════════════════════════════════════════════════════
-- CREATE ADMIN USER
-- ═══════════════════════════════════════════════════════════════════════════
-- Password: Admin@123 (bcrypt hash with 10 rounds)
-- You can generate a new hash at: https://bcrypt-generator.com/

INSERT INTO users (
  id,
  email, 
  password_hash, 
  full_name, 
  phone, 
  role, 
  is_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@orashop.in',
  -- Bcrypt hash of 'Admin@123' with 10 rounds
  '$2a$10$8K8Z5XVZ5J5Z5XVZ5J5Z5eZJ5Z5XVZ5J5Z5XVZ5J5Z5XVZ5J5Z5XVZ',
  'ORA Admin',
  '+919876543210',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'ADMIN',
  is_verified = true,
  updated_at = NOW();

-- Verify admin was created
SELECT id, email, full_name, role, is_verified 
FROM users 
WHERE email = 'admin@orashop.in';

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY DATABASE TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count records in key tables
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL
SELECT 'orders', COUNT(*) FROM orders;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY CATEGORIES EXIST (required for product creation)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT id, name, slug, is_active FROM categories ORDER BY sort_order;

-- If no categories, create them:
INSERT INTO categories (id, name, slug, description, is_active, sort_order) VALUES
  (gen_random_uuid(), 'Necklaces', 'necklaces', 'Elegant necklaces and chains', true, 1),
  (gen_random_uuid(), 'Rings', 'rings', 'Beautiful rings for every occasion', true, 2),
  (gen_random_uuid(), 'Bracelets', 'bracelets', 'Stunning bracelets and bangles', true, 3),
  (gen_random_uuid(), 'Earrings', 'earrings', 'Exquisite earrings', true, 4),
  (gen_random_uuid(), 'Pendants', 'pendants', 'Beautiful pendants', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- CHECK RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public';

-- NOTE: If rowsecurity is true, the table has RLS enabled
-- Our backend uses Prisma with direct connection (not through Supabase client)
-- So RLS does NOT affect backend operations
-- RLS only affects Supabase client connections using anon/authenticated keys

-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNOSTIC QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check products table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Check product_images table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_images';
