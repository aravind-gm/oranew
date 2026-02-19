-- PHASE 2: Revenue Engines Migration
-- Adds: AbandonedCartLog, PaymentRetryToken, lowStockAlertSentAt

-- Add lowStockAlertSentAt to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "low_stock_alert_sent_at" TIMESTAMP(3);

-- Create abandoned_cart_logs table
CREATE TABLE IF NOT EXISTS "abandoned_cart_logs" (
    "id"            TEXT NOT NULL,
    "user_id"       TEXT NOT NULL,
    "email_sent_at" TIMESTAMP(3) NOT NULL,
    "cart_total"    DOUBLE PRECISION NOT NULL,
    "item_count"    INTEGER NOT NULL,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abandoned_cart_logs_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one log per user
CREATE UNIQUE INDEX IF NOT EXISTS "abandoned_cart_logs_user_id_key"
    ON "abandoned_cart_logs"("user_id");

-- Index for cooldown queries
CREATE INDEX IF NOT EXISTS "abandoned_cart_logs_email_sent_at_idx"
    ON "abandoned_cart_logs"("email_sent_at");

-- FK: user_id -> users.id (cascade delete)
ALTER TABLE "abandoned_cart_logs"
    ADD CONSTRAINT "abandoned_cart_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create payment_retry_tokens table
CREATE TABLE IF NOT EXISTS "payment_retry_tokens" (
    "id"         TEXT NOT NULL,
    "order_id"   TEXT NOT NULL,
    "token"      TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used"       BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_retry_tokens_pkey" PRIMARY KEY ("id")
);

-- Unique + lookup indexes
CREATE UNIQUE INDEX IF NOT EXISTS "payment_retry_tokens_token_key"
    ON "payment_retry_tokens"("token");

CREATE INDEX IF NOT EXISTS "payment_retry_tokens_token_idx"
    ON "payment_retry_tokens"("token");

CREATE INDEX IF NOT EXISTS "payment_retry_tokens_order_id_idx"
    ON "payment_retry_tokens"("order_id");

CREATE INDEX IF NOT EXISTS "payment_retry_tokens_expires_at_idx"
    ON "payment_retry_tokens"("expires_at");

-- FK: order_id -> orders.id (cascade delete)
ALTER TABLE "payment_retry_tokens"
    ADD CONSTRAINT "payment_retry_tokens_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
