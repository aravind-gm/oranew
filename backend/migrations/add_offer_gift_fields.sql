-- Migration: Replace BOGO with "Buy Necklace → Get Ring Free" Offer Engine
-- Date: 2026-08-03
--
-- Strategy: Repurpose existing BOGO columns rather than dropping/recreating.
--   isBOGOEligible  → product is eligible for the current offer campaign
--   bogoCategory    → "necklace" (trigger) | "ring" (free gift) | null
--   bogoActive      → product is live in the campaign right now
--   BOGOCampaign    → repurposed as OfferCampaign (no structural change needed)
--
-- New: order_items gain two columns to track free-gift linkage

-- 1. Add free-gift tracking columns to order_items
ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "is_free_gift"           BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "gift_for_order_item_id" TEXT     REFERENCES "order_items"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "order_items_is_free_gift_idx"  ON "order_items"("is_free_gift");
CREATE INDEX IF NOT EXISTS "order_items_gift_for_idx"      ON "order_items"("gift_for_order_item_id");

-- 2. Rename bogo_campaigns row (cosmetic, keeps schema intact)
UPDATE "bogo_campaigns"
SET    name = 'Buy Any Necklace — Get a Ring FREE'
WHERE  name ILIKE '%bogo%' OR name ILIKE '%combo%';

-- 3. Ensure correct offer categories on eligible products
--    (Admin will finalise via admin panel; this just seeds correct values)
UPDATE "products"
SET    "bogo_category" = 'necklace'
WHERE  "is_bogo_eligible" = true
  AND  EXISTS (
         SELECT 1 FROM "categories" c
         WHERE  c.id = "products"."category_id"
           AND  c.slug ILIKE '%necklace%'
       );

UPDATE "products"
SET    "bogo_category" = 'ring'
WHERE  "is_bogo_eligible" = true
  AND  EXISTS (
         SELECT 1 FROM "categories" c
         WHERE  c.id = "products"."category_id"
           AND  c.slug ILIKE '%ring%'
       );
