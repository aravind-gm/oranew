-- Add gift collections and occasions to products
-- Migration: add_gift_collections_occasions

ALTER TABLE "products" 
  ADD COLUMN IF NOT EXISTS "collections" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "occasions" TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "is_featured_gift" BOOLEAN DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "products_collections_idx" ON "products" USING GIN ("collections");
CREATE INDEX IF NOT EXISTS "products_occasions_idx" ON "products" USING GIN ("occasions");
CREATE INDEX IF NOT EXISTS "products_is_featured_gift_idx" ON "products"("is_featured_gift") WHERE "is_featured_gift" = true;

-- Add comment
COMMENT ON COLUMN "products"."collections" IS 'Gift collections this product belongs to, e.g., ["gifts-for-her", "valentine-special"]';
COMMENT ON COLUMN "products"."occasions" IS 'Occasions this product is suitable for, e.g., ["birthday", "anniversary", "valentine"]';
COMMENT ON COLUMN "products"."is_featured_gift" IS 'Whether this product is featured in Gifts For Her page';
