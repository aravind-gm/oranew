-- Add product video and HSN fields
ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "video_url" TEXT,
  ADD COLUMN IF NOT EXISTS "hsn_code" VARCHAR(20);