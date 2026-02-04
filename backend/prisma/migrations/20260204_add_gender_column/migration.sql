-- Add gender column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
