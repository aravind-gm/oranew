-- Step 2: Inventory & Transaction Hardening Migration
-- Adds CouponUsage table and stock quantity constraint

-- 1. Create CouponUsage table for per-user coupon tracking
CREATE TABLE IF NOT EXISTS "coupon_usages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- 2. Add unique constraint (each user can use a coupon only once)
CREATE UNIQUE INDEX IF NOT EXISTS "coupon_usages_user_id_coupon_id_key" ON "coupon_usages"("user_id", "coupon_id");

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");
CREATE INDEX IF NOT EXISTS "coupon_usages_user_id_idx" ON "coupon_usages"("user_id");

-- 4. Add foreign key constraints
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Add CHECK constraint to prevent negative stock (DB-level enforcement)
-- Note: Prisma doesn't support CHECK constraints in schema yet, must be done via raw SQL
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'products_stock_quantity_check'
    ) THEN
        ALTER TABLE "products" DROP CONSTRAINT "products_stock_quantity_check";
    END IF;
    
    -- Add new constraint
    ALTER TABLE "products" ADD CONSTRAINT "products_stock_quantity_check" CHECK ("stock_quantity" >= 0);
END $$;

-- 6. Comment explaining the constraints
COMMENT ON CONSTRAINT "products_stock_quantity_check" ON "products" IS 'Prevents negative stock quantities - enforced at database level';
COMMENT ON TABLE "coupon_usages" IS 'Tracks per-user coupon usage to prevent multi-use abuse';
