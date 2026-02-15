-- Add BOGO campaign fields to products table

ALTER TABLE "products" 
  ADD COLUMN IF NOT EXISTS "is_bogo_eligible" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bogo_price_tier" INTEGER,
  ADD COLUMN IF NOT EXISTS "bogo_category" TEXT;

-- Create index for BOGO queries
CREATE INDEX IF NOT EXISTS "products_is_bogo_eligible_idx" ON "products"("is_bogo_eligible") WHERE "is_bogo_eligible" = true;
