-- Migration: Add Tumbler & Offer Fields to Product + OfferCampaign table
-- Run: npx prisma migrate dev --name add_tumbler_offer_fields
-- OR apply directly to Supabase via SQL editor

-- ============================================
-- 1) Product table — Tumbler fields
-- ============================================
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_tumbler" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "capacity" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_bestseller" BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 2) Product table — Offer fields
-- ============================================
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_on_offer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_type" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_value" DECIMAL(65,30);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "offer_expiry" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "show_countdown" BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- 3) Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS "products_is_on_offer_offer_type_idx" ON "products" ("is_on_offer", "offer_type");
CREATE INDEX IF NOT EXISTS "products_is_tumbler_idx" ON "products" ("is_tumbler");
CREATE INDEX IF NOT EXISTS "products_is_bestseller_idx" ON "products" ("is_bestseller");

-- ============================================
-- 4) OfferCampaign table
-- ============================================
CREATE TABLE IF NOT EXISTS "offer_campaigns" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT false,
  "discount_type" TEXT NOT NULL DEFAULT 'PERCENT',
  "discount_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "collections" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "show_countdown" BOOLEAN NOT NULL DEFAULT true,
  "banner_text" TEXT,
  "total_usage_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "offer_campaigns_pkey" PRIMARY KEY ("id")
);
