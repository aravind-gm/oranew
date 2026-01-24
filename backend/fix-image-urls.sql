-- Fix malformed image URLs to ensure they use /public/ path
-- This ensures images are accessible from the storefront

UPDATE product_images
SET image_url = REPLACE(image_url, '/object/', '/object/public/')
WHERE image_url LIKE '%supabase.co%'
AND image_url NOT LIKE '%/object/public/%'
AND image_url IS NOT NULL;

-- Verify the update
SELECT COUNT(*) as updated_count, 
       COUNT(CASE WHEN image_url LIKE '%/object/public/%' THEN 1 END) as public_urls
FROM product_images
WHERE image_url LIKE '%supabase.co%';
