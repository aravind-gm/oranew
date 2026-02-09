-- Cloudflare R2 + CDN Migration
-- This migration adds support for the new image architecture

-- ============================================
-- STEP 1: Update product_images table with image_role
-- ============================================

-- Add image_role column to product_images if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_images' AND column_name = 'image_role'
    ) THEN
        ALTER TABLE product_images 
        ADD COLUMN image_role TEXT CHECK (image_role IN ('thumbnail', 'listing', 'hero', 'zoom'));
    END IF;
END $$;

-- ============================================
-- STEP 2: Create banners table for marketing content
-- ============================================

CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page TEXT NOT NULL CHECK (page IN ('home', 'collection', 'checkout', 'cart', 'product')),
    title TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    cta_text TEXT,
    cta_link TEXT,
    position TEXT DEFAULT 'hero' CHECK (position IN ('hero', 'sidebar', 'footer', 'popup')),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create indexes for banners
CREATE INDEX IF NOT EXISTS idx_banners_page ON banners(page);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, end_date);

-- ============================================
-- STEP 3: Create collection_images table
-- ============================================

CREATE TABLE IF NOT EXISTS collection_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_slug TEXT NOT NULL UNIQUE,
    hero_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_images_slug ON collection_images(collection_slug);

-- ============================================
-- STEP 4: Create brand_assets table
-- ============================================

CREATE TABLE IF NOT EXISTS brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'favicon', 'og_image', 'watermark')),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_assets_type_active ON brand_assets(asset_type) WHERE is_active = true;

-- ============================================
-- STEP 5: Create image_migrations tracking table
-- ============================================

CREATE TABLE IF NOT EXISTS image_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_url TEXT NOT NULL,
    new_url TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'banner', 'collection', 'brand')),
    entity_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'migrated', 'verified', 'failed')),
    error_message TEXT,
    migrated_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_migrations_status ON image_migrations(status);
CREATE INDEX IF NOT EXISTS idx_image_migrations_entity ON image_migrations(entity_type, entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_image_migrations_original ON image_migrations(original_url);

-- ============================================
-- STEP 6: Update existing product_images to add image_role
-- ============================================

-- Set first image as 'hero' for products that have images
UPDATE product_images pi
SET image_role = 'hero'
WHERE pi.id IN (
    SELECT DISTINCT ON (product_id) id
    FROM product_images
    WHERE image_role IS NULL
    ORDER BY product_id, sort_order ASC, created_at ASC
);

-- Set remaining images as 'listing'
UPDATE product_images
SET image_role = 'listing'
WHERE image_role IS NULL;

-- ============================================
-- STEP 7: Add CDN URL tracking columns
-- ============================================

-- Add cdn_verified column to track migration status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_images' AND column_name = 'cdn_verified'
    ) THEN
        ALTER TABLE product_images 
        ADD COLUMN cdn_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add original_url column to keep old URL during migration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_images' AND column_name = 'original_url'
    ) THEN
        ALTER TABLE product_images 
        ADD COLUMN original_url TEXT;
    END IF;
END $$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant select on banners for authenticated users
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Banners are viewable by everyone"
    ON banners FOR SELECT
    USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY IF NOT EXISTS "Banners are editable by admins"
    ON banners FOR ALL
    USING (true)
    WITH CHECK (true);

-- Similar RLS for other tables
ALTER TABLE collection_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Collection images are viewable by everyone"
    ON collection_images FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "Collection images are editable by admins"
    ON collection_images FOR ALL
    USING (true)
    WITH CHECK (true);

ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Brand assets are viewable by everyone"
    ON brand_assets FOR SELECT
    USING (is_active = true);

CREATE POLICY IF NOT EXISTS "Brand assets are editable by admins"
    ON brand_assets FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
