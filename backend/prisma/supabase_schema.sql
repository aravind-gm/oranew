-- =========================================================
-- ORA JEWELLERY - COMPLETE SUPABASE POSTGRESQL SQL SCHEMA
-- Execute this script in Supabase SQL Editor
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'ADMIN', 'STAFF');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'CONFIRMED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('RAZORPAY', 'STRIPE', 'COD');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "AddressType" AS ENUM ('HOME', 'OFFICE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'LOW_STOCK', 'NEW_REVIEW');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "BOGODiscountType" AS ENUM ('FREE_CHEAPER', 'PERCENT', 'FIXED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ImageRole" AS ENUM ('THUMBNAIL', 'LISTING', 'HERO', 'ZOOM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- TABLES
-- ============================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "supabase_id" VARCHAR(255) UNIQUE,
    "password_hash" TEXT,
    "full_name" VARCHAR(255) DEFAULT '',
    "phone" VARCHAR(50),
    "gender" VARCHAR(20),
    "role" "UserRole" DEFAULT 'CUSTOMER',
    "is_verified" BOOLEAN DEFAULT FALSE,
    "profile_completed" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ADDRESSES
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "pincode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) DEFAULT 'India',
    "is_default" BOOLEAN DEFAULT FALSE,
    "address_type" "AddressType" DEFAULT 'HOME'
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "meta_title" VARCHAR(60),
    "meta_description" VARCHAR(160),
    "canonical_url" TEXT,
    "og_image" TEXT,
    "seo_content" TEXT,
    "parent_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
    "is_active" BOOLEAN DEFAULT TRUE,
    "sort_order" INT DEFAULT 0
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "short_description" VARCHAR(500),
    "price" DECIMAL(10, 2) NOT NULL,
    "discount_percentage" DECIMAL(5, 2) DEFAULT 0,
    "final_price" DECIMAL(10, 2) NOT NULL,
    "sku" VARCHAR(100) UNIQUE NOT NULL,
    "category_id" UUID NOT NULL REFERENCES "categories"("id"),
    "material" VARCHAR(100),
    "care_instructions" TEXT,
    "weight" VARCHAR(50),
    "dimensions" VARCHAR(50),
    "stock_quantity" INT DEFAULT 0,
    "low_stock_threshold" INT DEFAULT 5,
    "is_active" BOOLEAN DEFAULT TRUE,
    "is_featured" BOOLEAN DEFAULT FALSE,
    "collections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "occasions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_featured_gift" BOOLEAN DEFAULT FALSE,
    "meta_title" VARCHAR(60),
    "meta_description" VARCHAR(160),
    "canonical_url" TEXT,
    "noindex" BOOLEAN DEFAULT FALSE,
    "primary_image_alt" VARCHAR(125),
    "average_rating" DECIMAL(3, 2) DEFAULT 0,
    "review_count" INT DEFAULT 0,
    "is_bogo_eligible" BOOLEAN DEFAULT FALSE,
    "bogo_price_tier" INT,
    "bogo_category" VARCHAR(50),
    "is_tumbler" BOOLEAN DEFAULT FALSE,
    "capacity" VARCHAR(50),
    "is_bestseller" BOOLEAN DEFAULT FALSE,
    "bogo_active" BOOLEAN DEFAULT FALSE,
    "gst_rate" DECIMAL(5, 2) DEFAULT 3,
    "hsn_code" VARCHAR(20),
    "video_url" TEXT,
    "is_on_offer" BOOLEAN DEFAULT FALSE,
    "offer_type" VARCHAR(50),
    "offer_value" DECIMAL(10, 2),
    "offer_expiry" TIMESTAMP WITH TIME ZONE,
    "show_countdown" BOOLEAN DEFAULT FALSE,
    "deleted_at" TIMESTAMP WITH TIME ZONE,
    "low_stock_alert_sent_at" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "image_url" TEXT NOT NULL,
    "alt_text" TEXT,
    "sort_order" INT DEFAULT 0,
    "is_primary" BOOLEAN DEFAULT FALSE,
    "image_role" "ImageRole",
    "cdn_verified" BOOLEAN DEFAULT FALSE,
    "original_url" TEXT
);

-- 6. BANNERS
CREATE TABLE IF NOT EXISTS "banners" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "page" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255),
    "image_url" TEXT NOT NULL,
    "mobile_image_url" TEXT,
    "cta_text" VARCHAR(100),
    "cta_link" TEXT,
    "position" VARCHAR(50) DEFAULT 'hero',
    "sort_order" INT DEFAULT 0,
    "is_active" BOOLEAN DEFAULT TRUE,
    "start_date" TIMESTAMP WITH TIME ZONE,
    "end_date" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) DEFAULT 'bar',
    "background_color" VARCHAR(50),
    "text_color" VARCHAR(50),
    "link" TEXT,
    "link_text" VARCHAR(100),
    "is_active" BOOLEAN DEFAULT TRUE,
    "priority" INT DEFAULT 1,
    "start_date" TIMESTAMP WITH TIME ZONE,
    "end_date" TIMESTAMP WITH TIME ZONE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. STATIC PAGES
CREATE TABLE IF NOT EXISTS "static_pages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "content" TEXT NOT NULL,
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "is_published" BOOLEAN DEFAULT FALSE,
    "sort_order" INT DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. REVIEWS
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "rating" INT NOT NULL,
    "title" VARCHAR(255),
    "review_text" TEXT,
    "is_verified_purchase" BOOLEAN DEFAULT FALSE,
    "is_approved" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_user_product_review" UNIQUE ("user_id", "product_id")
);

-- 10. CART ITEMS
CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "quantity" INT DEFAULT 1,
    "added_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_user_cart_item" UNIQUE ("user_id", "product_id")
);

-- 11. WISHLISTS
CREATE TABLE IF NOT EXISTS "wishlists" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "added_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_user_wishlist_item" UNIQUE ("user_id", "product_id")
);

-- 12. ORDERS
CREATE TABLE IF NOT EXISTS "orders" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_number" VARCHAR(100) UNIQUE NOT NULL,
    "user_id" UUID NOT NULL REFERENCES "users"("id"),
    "status" "OrderStatus" DEFAULT 'PENDING',
    "subtotal" DECIMAL(10, 2) NOT NULL,
    "discount_amount" DECIMAL(10, 2) DEFAULT 0,
    "coupon_code" VARCHAR(100),
    "gst_amount" DECIMAL(10, 2) NOT NULL,
    "shipping_fee" DECIMAL(10, 2) DEFAULT 0,
    "total_amount" DECIMAL(10, 2) NOT NULL,
    "shipping_address_id" UUID NOT NULL REFERENCES "addresses"("id"),
    "billing_address_id" UUID NOT NULL REFERENCES "addresses"("id"),
    "payment_method" VARCHAR(50),
    "payment_status" "PaymentStatus" DEFAULT 'PENDING',
    "tracking_number" VARCHAR(100),
    "courier_name" VARCHAR(100),
    "shiprocket_order_id" VARCHAR(100),
    "shipment_status" VARCHAR(100),
    "shipped_at" TIMESTAMP WITH TIME ZONE,
    "delivered_at" TIMESTAMP WITH TIME ZONE,
    "cancelled_at" TIMESTAMP WITH TIME ZONE,
    "cancel_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. ORDER ITEMS
CREATE TABLE IF NOT EXISTS "order_items" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "product_id" UUID NOT NULL REFERENCES "products"("id"),
    "product_name" VARCHAR(255) NOT NULL,
    "product_image" TEXT,
    "quantity" INT NOT NULL,
    "unit_price" DECIMAL(10, 2) NOT NULL,
    "discount" DECIMAL(10, 2) DEFAULT 0,
    "gst_rate" DECIMAL(5, 2) NOT NULL,
    "total_price" DECIMAL(10, 2) NOT NULL,
    "is_free_gift" BOOLEAN DEFAULT FALSE,
    "gift_for_order_item_id" UUID REFERENCES "order_items"("id") ON DELETE SET NULL
);

-- 14. PAYMENTS
CREATE TABLE IF NOT EXISTS "payments" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id"),
    "payment_gateway" "PaymentMethod" NOT NULL,
    "transaction_id" VARCHAR(255) UNIQUE,
    "amount" DECIMAL(10, 2) NOT NULL,
    "currency" VARCHAR(10) DEFAULT 'INR',
    "status" "PaymentStatus" DEFAULT 'PENDING',
    "payment_method" VARCHAR(50),
    "gateway_response" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. RETURNS
CREATE TABLE IF NOT EXISTS "returns" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "order_id" UUID NOT NULL REFERENCES "orders"("id"),
    "user_id" UUID NOT NULL REFERENCES "users"("id"),
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReturnStatus" DEFAULT 'REQUESTED',
    "refund_amount" DECIMAL(10, 2),
    "restocked" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP WITH TIME ZONE
);

-- 16. COUPONS
CREATE TABLE IF NOT EXISTS "coupons" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "code" VARCHAR(100) UNIQUE NOT NULL,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10, 2) NOT NULL,
    "min_order_amount" DECIMAL(10, 2),
    "max_discount" DECIMAL(10, 2),
    "usage_limit" INT,
    "usage_count" INT DEFAULT 0,
    "valid_from" TIMESTAMP WITH TIME ZONE NOT NULL,
    "valid_until" TIMESTAMP WITH TIME ZONE NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. COUPON USAGES
CREATE TABLE IF NOT EXISTS "coupon_usages" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "coupon_id" UUID NOT NULL REFERENCES "coupons"("id") ON DELETE CASCADE,
    "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
    "used_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "unique_user_coupon_usage" UNIQUE ("user_id", "coupon_id")
);

-- 18. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES "users"("id") ON DELETE CASCADE,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT FALSE,
    "metadata" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. INVENTORY LOCKS
CREATE TABLE IF NOT EXISTS "inventory_locks" (
    "id" TEXT PRIMARY KEY,
    "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "order_id" UUID REFERENCES "orders"("id") ON DELETE CASCADE,
    "quantity" INT NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. REFRESH TOKENS
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "token" VARCHAR(500) UNIQUE NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. ABANDONED CART LOGS
CREATE TABLE IF NOT EXISTS "abandoned_cart_logs" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "email_sent_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "cart_total" DOUBLE PRECISION NOT NULL,
    "item_count" INT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_addresses_user_id" ON "addresses"("user_id");
CREATE INDEX IF NOT EXISTS "idx_products_slug" ON "products"("slug");
CREATE INDEX IF NOT EXISTS "idx_products_category_id" ON "products"("category_id");
CREATE INDEX IF NOT EXISTS "idx_products_active_featured" ON "products"("is_active", "is_featured");
CREATE INDEX IF NOT EXISTS "idx_products_is_tumbler" ON "products"("is_tumbler");
CREATE INDEX IF NOT EXISTS "idx_products_is_bestseller" ON "products"("is_bestseller");

CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "orders"("user_id");
CREATE INDEX IF NOT EXISTS "idx_orders_order_number" ON "orders"("order_number");
CREATE INDEX IF NOT EXISTS "idx_orders_status" ON "orders"("status");

CREATE INDEX IF NOT EXISTS "idx_payments_order_id" ON "payments"("order_id");
CREATE INDEX IF NOT EXISTS "idx_payments_transaction_id" ON "payments"("transaction_id");

CREATE INDEX IF NOT EXISTS "idx_inventory_locks_expires_at" ON "inventory_locks"("expires_at");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_token" ON "refresh_tokens"("token");
