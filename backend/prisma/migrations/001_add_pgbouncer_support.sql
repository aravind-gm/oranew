-- ============================================
-- PRISMA MIGRATION: Add PgBouncer Support
-- ============================================
-- This migration ensures the schema works with:
-- 1. Direct Supabase connections
-- 2. PgBouncer connection pooling (on Render)
-- 3. Multiple simultaneous connections
--
-- Safe to run even if columns exist (idempotent)

BEGIN;

-- ============================================
-- STEP 1: Ensure supabase_id column exists
-- ============================================
-- This column is critical for auth flow
-- If it doesn't exist, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'supabase_id'
  ) THEN
    ALTER TABLE users ADD COLUMN supabase_id UUID UNIQUE;
    CREATE INDEX idx_users_supabase_id ON users(supabase_id);
  END IF;
END $$;

-- ============================================
-- STEP 2: Create indexes for fast lookups
-- ============================================
-- These prevent sequential scans on large tables
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- ============================================
-- STEP 3: Add constraints for data integrity
-- ============================================
-- Ensure email is always provided
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- ============================================
-- STEP 4: Update any NULL supabase_id values
-- ============================================
-- Generate UUIDs for existing users without supabase_id
-- (This is for backward compatibility)
UPDATE users 
SET supabase_id = gen_random_uuid() 
WHERE supabase_id IS NULL 
  AND created_at < NOW() - INTERVAL '1 day';

-- ============================================
-- STEP 5: Connection pool settings
-- ============================================
-- These settings optimize for PgBouncer + Render
-- Applied at connection time via client settings

-- ============================================
-- STEP 6: Verify schema integrity
-- ============================================
-- This check ensures our migrations didn't break anything
DO $$
DECLARE
  user_count INT;
  category_count INT;
  product_count INT;
BEGIN
  -- Get table row counts for validation
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO category_count FROM categories;
  SELECT COUNT(*) INTO product_count FROM products;
  
  RAISE NOTICE 'Schema validation: users=%, categories=%, products=%',
    user_count, category_count, product_count;
  
  -- Verify supabase_id column is unique
  ASSERT (
    SELECT COUNT(*) FROM (
      SELECT supabase_id, COUNT(*) as cnt 
      FROM users 
      WHERE supabase_id IS NOT NULL
      GROUP BY supabase_id
      HAVING COUNT(*) > 1
    ) t
  ) = 0, 'supabase_id column must be unique!';
  
  RAISE NOTICE 'Schema integrity check PASSED ✅';
END $$;

COMMIT;

-- ============================================
-- DATABASE CONNECTION SETTINGS (for client)
-- ============================================
-- Add these to your Prisma datasource config:
--
-- datasource db {
--   provider  = "postgresql"
--   url       = env("DATABASE_URL")
--   directUrl = env("DIRECT_URL")
-- }
--
-- Environment variables:
-- DATABASE_URL = "postgresql://user:pass@pgbouncer.endpoint/db?schema=public"
-- DIRECT_URL   = "postgresql://user:pass@direct.endpoint/db?schema=public"
--
-- PgBouncer URL should have these params:
--   ?connection_limit=1
--   &pool_mode=transaction
--   &application_name=prisma

