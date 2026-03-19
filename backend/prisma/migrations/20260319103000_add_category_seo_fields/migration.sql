ALTER TABLE "categories"
  ADD COLUMN IF NOT EXISTS "meta_title" VARCHAR(60),
  ADD COLUMN IF NOT EXISTS "meta_description" VARCHAR(160),
  ADD COLUMN IF NOT EXISTS "canonical_url" TEXT,
  ADD COLUMN IF NOT EXISTS "og_image" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_content" TEXT;

CREATE INDEX IF NOT EXISTS "categories_meta_title_idx" ON "categories"("meta_title");
