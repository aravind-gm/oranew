-- Run this in Supabase SQL Editor to add supabase_id column
-- This fixes the "column supabase_id does not exist" error

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "supabase_id" TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS "idx_users_supabase_id" 
ON "users"("supabase_id");

-- Verify column was created
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'supabase_id';
