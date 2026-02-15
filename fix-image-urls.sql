-- Fix Image URLs: Replace cdn.orashop.in with Supabase Storage URLs
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/hgejomvgldqnqzkgffoi/sql/new)

-- Preview affected products (DO THIS FIRST)
SELECT 
  id, 
  name,
  images::text
FROM products
WHERE images::text LIKE '%cdn.orashop.in%'
LIMIT 5;

-- If preview looks good, run the actual UPDATE:
UPDATE products
SET images = REPLACE(
  images::text, 
  'https://cdn.orashop.in/products/', 
  'https://hgejomvgldqnqzkgffoi.supabase.co/storage/v1/object/public/product-images/'
)::jsonb
WHERE images::text LIKE '%cdn.orashop.in%';

-- Check banners table too
UPDATE banners
SET "imageUrl" = REPLACE(
  "imageUrl",
  'https://cdn.orashop.in/',
  'https://hgejomvgldqnqzkgffoi.supabase.co/storage/v1/object/public/'
)
WHERE "imageUrl" LIKE '%cdn.orashop.in%';

-- Verify the fix
SELECT 
  id,
  name,
  images::text
FROM products
LIMIT 3;
