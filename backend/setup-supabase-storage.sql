-- ═══════════════════════════════════════════════════════════════════════════
-- ORA JEWELLERY - SUPABASE STORAGE SETUP
-- ═══════════════════════════════════════════════════════════════════════════
-- Run this in Supabase Dashboard > SQL Editor
-- This creates the storage bucket and policies for product images
-- ═══════════════════════════════════════════════════════════════════════════

-- Step 1: Create the product-images bucket
-- Note: Buckets are created via the Storage API, not SQL
-- Go to Supabase Dashboard > Storage > Create bucket
-- Name: product-images
-- Public: YES (for product images to be publicly viewable)

-- Step 2: Create storage policies for the bucket
-- These allow the service role to upload/delete, and public to read

-- Policy: Allow public read access to all images
INSERT INTO storage.policies (name, bucket_id, definition)
SELECT 
  'Public Read Access',
  id,
  '(bucket_id = ''product-images'')'::jsonb
FROM storage.buckets 
WHERE name = 'product-images'
ON CONFLICT DO NOTHING;

-- Alternative: Use the Supabase Dashboard UI
-- Go to Storage > product-images > Policies
-- Add policy for SELECT: Allow all users to read files
-- Add policy for INSERT: Allow authenticated users (or service role)
-- Add policy for DELETE: Allow authenticated users (or service role)

-- ═══════════════════════════════════════════════════════════════════════════
-- MANUAL STEPS (Do these in Supabase Dashboard):
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- 1. Go to Storage in left sidebar
-- 2. Click "New bucket"
-- 3. Name: product-images
-- 4. Toggle "Public bucket" to ON
-- 5. Click "Create bucket"
-- 
-- 6. Click on "product-images" bucket
-- 7. Go to "Policies" tab
-- 8. Click "New Policy"
-- 9. Select "For full customization"
-- 10. Create these policies:
--
--     POLICY 1: Public Read
--     - Name: "Allow public read"
--     - Allowed operations: SELECT
--     - Policy definition: true
--
--     POLICY 2: Service Role Upload (the service_role key bypasses RLS)
--     - Name: "Allow service role upload"
--     - Allowed operations: INSERT
--     - Policy definition: (role() = 'service_role')
--
--     POLICY 3: Service Role Delete
--     - Name: "Allow service role delete"
--     - Allowed operations: DELETE  
--     - Policy definition: (role() = 'service_role')
--
-- ═══════════════════════════════════════════════════════════════════════════

-- Verify bucket exists
SELECT * FROM storage.buckets WHERE name = 'product-images';

-- Verify policies
SELECT * FROM storage.policies WHERE bucket_id = (
  SELECT id FROM storage.buckets WHERE name = 'product-images'
);
