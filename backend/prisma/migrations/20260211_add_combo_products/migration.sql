-- CreateTable: combo_products
-- Supports the "Combos for Her" BOGO bundle system

CREATE TABLE "combo_products" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "combo_price" DECIMAL(10,2) NOT NULL,
    "original_total" DECIMAL(10,2) NOT NULL,
    "savings_amount" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "primary_product_id" TEXT NOT NULL,
    "free_product_id" TEXT NOT NULL,
    "primary_image" TEXT,
    "free_image" TEXT,
    "hover_image" TEXT,
    "badge" TEXT,
    "tag" TEXT,
    "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_limited" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combo_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combo_products_slug_key" ON "combo_products"("slug");
CREATE INDEX "combo_products_is_active_idx" ON "combo_products"("is_active");
CREATE INDEX "combo_products_slug_idx" ON "combo_products"("slug");
CREATE INDEX "combo_products_sort_order_idx" ON "combo_products"("sort_order");

-- AddForeignKey
ALTER TABLE "combo_products" ADD CONSTRAINT "combo_products_primary_product_id_fkey" FOREIGN KEY ("primary_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "combo_products" ADD CONSTRAINT "combo_products_free_product_id_fkey" FOREIGN KEY ("free_product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
