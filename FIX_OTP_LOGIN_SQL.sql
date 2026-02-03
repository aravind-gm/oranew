-- =============================================================================
-- FIX: Add supabase_id column to users table
-- =============================================================================
-- 
-- PROBLEM: 
-- - Prisma schema expects supabase_id column but it doesn't exist in DB
-- - Error: "The column `supabase_id` does not exist"
-- 
-- SOLUTION:
-- - Add UUID column with UNIQUE constraint
-- - Create index for faster queries
-- - Make it NULLABLE initially for existing users
--

-- Step 1: Add column if it doesn't exist
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "supabase_id" UUID UNIQUE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_users_supabase_id" ON "users"("supabase_id");

-- Step 3: Verify the column was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'supabase_id';

-- =============================================================================
-- Explanation of the fix:
-- =============================================================================
-- 
-- Why this works:
-- 1. UUID type matches Supabase auth user IDs (UUID format)
-- 2. UNIQUE constraint ensures one supabase_id per user
-- 3. Index speeds up queries like:
--    SELECT * FROM users WHERE supabase_id = '...'
-- 4. Made NULLABLE so existing users can have NULL supabase_id initially
-- 
-- The Prisma schema already has:
--   supabaseId     String?         @unique @map("supabase_id")
-- 
-- So once this column exists, the login will work:
--   - New OTP users get supabase_id when they login
--   - Email-based lookups work for existing users
--   - supabaseId provides unique identification for fast queries
-- =============================================================================
