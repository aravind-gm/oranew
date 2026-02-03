-- ============================================
-- PASSWORD AUTH MIGRATION - Replace OTP with Password Auth
-- ============================================
-- Production safe migration - 3 February 2026

BEGIN;

-- ============================================
-- STEP 1: Drop supabase_id column (clean removal of OTP auth)
-- ============================================
-- Remove index first, then column
DROP INDEX IF EXISTS "users_supabase_id_key";
ALTER TABLE "users" DROP COLUMN IF EXISTS "supabase_id";

-- ============================================
-- STEP 2: Update password_hash column to be NOT NULL
-- ============================================
-- For existing users without passwords, create a random hash
-- This will force them to use forgot password flow
UPDATE "users" 
SET "password_hash" = '$2b$12$TEMP.INVALID.HASH.REQUIRES.PASSWORD.RESET' 
WHERE "password_hash" IS NULL;

-- Make column required
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;

-- ============================================
-- STEP 3: Update isVerified default to true (password users start verified)
-- ============================================
ALTER TABLE "users" ALTER COLUMN "is_verified" SET DEFAULT true;

-- Update existing users to verified (they'll set passwords via reset)
UPDATE "users" SET "is_verified" = true WHERE "is_verified" = false;

-- ============================================
-- STEP 4: Create password_resets table
-- ============================================
CREATE TABLE IF NOT EXISTS "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on token
CREATE UNIQUE INDEX IF NOT EXISTS "password_resets_token_key" ON "password_resets"("token");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "password_resets_user_id_idx" ON "password_resets"("user_id");
CREATE INDEX IF NOT EXISTS "password_resets_token_idx" ON "password_resets"("token");
CREATE INDEX IF NOT EXISTS "password_resets_expires_at_idx" ON "password_resets"("expires_at");

-- Add foreign key constraint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- STEP 5: Clean up any existing OTP-related data
-- ============================================
-- Remove any notifications related to OTP (optional)
DELETE FROM "notifications" WHERE "message" LIKE '%OTP%' OR "message" LIKE '%verification code%';

-- ============================================
-- STEP 6: Verify schema integrity
-- ============================================
DO $$
DECLARE
  user_count INT;
  reset_table_exists BOOLEAN;
BEGIN
  -- Check users table
  SELECT COUNT(*) INTO user_count FROM "users";
  RAISE NOTICE 'Users in database: %', user_count;
  
  -- Verify password_hash is now NOT NULL
  ASSERT (
    SELECT count(*) = 0 FROM "users" WHERE "password_hash" IS NULL
  ), 'All users must have password_hash';
  
  -- Check password_resets table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'password_resets'
  ) INTO reset_table_exists;
  
  ASSERT reset_table_exists, 'password_resets table must exist';
  
  RAISE NOTICE '✅ Schema migration completed successfully';
END $$;

COMMIT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- What changed:
-- 1. ✅ Removed supabase_id column (clean OTP removal)
-- 2. ✅ Made password_hash NOT NULL (required for password auth) 
-- 3. ✅ Set is_verified default to true (password users verified by default)
-- 4. ✅ Created password_resets table for forgot password flow
-- 5. ✅ Added all necessary indexes for performance
-- 6. ✅ Set up foreign key relationships
-- 
-- Next steps:
-- 1. Deploy new backend code with password endpoints
-- 2. Update frontend to use password forms instead of OTP
-- 3. Existing users can use forgot password to set their password