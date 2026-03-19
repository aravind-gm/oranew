-- Add canonical URL and noindex SEO controls for product pages

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "canonical_url" TEXT;

ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "noindex" BOOLEAN NOT NULL DEFAULT false;
