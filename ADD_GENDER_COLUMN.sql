-- Add gender column to users table if it doesn't exist
-- Run this directly in Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'gender';
