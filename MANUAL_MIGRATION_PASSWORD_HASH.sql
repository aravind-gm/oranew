-- ============================================
-- MANUAL MIGRATION: Make password_hash nullable
-- ============================================
-- 
-- If automatic migrations fail, run this SQL manually in Supabase SQL Editor:
-- 1. Go to: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Click "New query"
-- 5. Paste the SQL below
-- 6. Click "Run"
--
-- This fixes the P2011 "Null constraint violation" OTP login error
--

-- Check current state
SELECT 
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';

-- Make password_hash nullable  
ALTER TABLE "users"
ALTER COLUMN "password_hash" DROP NOT NULL;

-- Verify the change
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';
