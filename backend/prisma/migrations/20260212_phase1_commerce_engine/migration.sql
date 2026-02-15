-- Phase 1: Commerce Engine Hardening
-- Adds: bogoActive, gstRate, deletedAt to Product; TaxConfig; ShippingConfig; indexes

-- =============================================
-- 1. Product table additions
-- =============================================
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "bogo_active" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gst_rate" DECIMAL(5,2) NOT NULL DEFAULT 3;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

-- =============================================
-- 2. TaxConfig table
-- =============================================
CREATE TABLE IF NOT EXISTS "tax_configs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "category_slug" TEXT NOT NULL,
  "gst_rate" DECIMAL(5,2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tax_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tax_configs_category_slug_key" ON "tax_configs"("category_slug");

-- =============================================
-- 3. ShippingConfig table
-- =============================================
CREATE TABLE IF NOT EXISTS "shipping_configs" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "free_threshold" DECIMAL(10,2) NOT NULL DEFAULT 999,
  "standard_fee" DECIMAL(10,2) NOT NULL DEFAULT 99,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipping_configs_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- 4. Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS "addresses_user_id_idx" ON "addresses"("user_id");

-- Review unique constraint (userId + productId)
-- Use DO block to avoid error if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_product_id_key'
  ) THEN
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_product_id_key" UNIQUE ("user_id", "product_id");
  END IF;
END $$;

-- =============================================
-- 5. Seed initial ShippingConfig
-- =============================================
INSERT INTO "shipping_configs" ("id", "free_threshold", "standard_fee", "is_active")
SELECT gen_random_uuid()::text, 999, 99, true
WHERE NOT EXISTS (SELECT 1 FROM "shipping_configs" LIMIT 1);

-- =============================================
-- 6. Seed default TaxConfig for jewellery
-- =============================================
INSERT INTO "tax_configs" ("id", "category_slug", "gst_rate")
SELECT gen_random_uuid()::text, 'jewellery', 3.00
WHERE NOT EXISTS (SELECT 1 FROM "tax_configs" WHERE "category_slug" = 'jewellery');
