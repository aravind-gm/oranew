-- ============================================================
-- ORA Jewellery — GIN Full-Text Search Index
-- Safe migration: uses IF NOT EXISTS, no schema.prisma changes
-- ============================================================
-- Run with:
--   psql "$DATABASE_URL" -f migrations/add_gin_search_index.sql
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_search
ON "Product"
USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
