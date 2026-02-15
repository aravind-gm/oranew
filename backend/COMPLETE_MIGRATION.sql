-- Complete migration for ORA admin content management

-- CreateTable banners (if not exists)
CREATE TABLE IF NOT EXISTS "banners" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "title" TEXT,
    "image_url" TEXT NOT NULL,
    "mobile_image_url" TEXT,
    "cta_text" TEXT,
    "cta_link" TEXT,
    "position" TEXT NOT NULL DEFAULT 'hero',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex banners
CREATE INDEX IF NOT EXISTS "banners_page_idx" ON "banners"("page");
CREATE INDEX IF NOT EXISTS "banners_is_active_idx" ON "banners"("is_active");

-- CreateTable announcements (if not exists)
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'bar',
    "background_color" TEXT,
    "text_color" TEXT,
    "link" TEXT,
    "link_text" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex announcements
CREATE INDEX IF NOT EXISTS "announcements_is_active_idx" ON "announcements"("is_active");
CREATE INDEX IF NOT EXISTS "announcements_priority_idx" ON "announcements"("priority");

-- CreateTable static_pages (if not exists)
CREATE TABLE IF NOT EXISTS "static_pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "static_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex static_pages
CREATE UNIQUE INDEX IF NOT EXISTS "static_pages_slug_key" ON "static_pages"("slug");
CREATE INDEX IF NOT EXISTS "static_pages_slug_idx" ON "static_pages"("slug");
CREATE INDEX IF NOT EXISTS "static_pages_is_published_idx" ON "static_pages"("is_published");
