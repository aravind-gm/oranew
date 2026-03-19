-- Add product SEO fields and safe length constraints
-- Safe for existing data: values longer than limits are truncated, rows are preserved.

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "primary_image_alt" VARCHAR(125);

ALTER TABLE "products"
ALTER COLUMN "meta_title" TYPE VARCHAR(60)
USING CASE
  WHEN "meta_title" IS NULL THEN NULL
  ELSE LEFT("meta_title", 60)
END;

ALTER TABLE "products"
ALTER COLUMN "meta_description" TYPE VARCHAR(160)
USING CASE
  WHEN "meta_description" IS NULL THEN NULL
  ELSE LEFT("meta_description", 160)
END;

CREATE INDEX IF NOT EXISTS "idx_products_slug" ON "products"("slug");
