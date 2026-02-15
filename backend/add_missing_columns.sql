-- Add missing columns to product_images table
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "image_role" TEXT;
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "cdn_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "original_url" TEXT;
