-- CreateTable announcements
CREATE TABLE "announcements" (
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

-- CreateIndex announcements_is_active_idx
CREATE INDEX "announcements_is_active_idx" ON "announcements"("is_active");

-- CreateIndex announcements_priority_idx
CREATE INDEX "announcements_priority_idx" ON "announcements"("priority");

-- CreateTable static_pages
CREATE TABLE "static_pages" (
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

-- CreateIndex static_pages_slug_key
CREATE UNIQUE INDEX "static_pages_slug_key" ON "static_pages"("slug");

-- CreateIndex static_pages_slug_idx
CREATE INDEX "static_pages_slug_idx" ON "static_pages"("slug");

-- CreateIndex static_pages_is_published_idx
CREATE INDEX "static_pages_is_published_idx" ON "static_pages"("is_published");
