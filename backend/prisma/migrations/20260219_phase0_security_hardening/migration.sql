-- =============================================================
-- PHASE 0 SECURITY HARDENING MIGRATION
-- Date: 2026-02-19
-- Purpose: Stock floor constraint + missing performance indexes
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. STOCK FLOOR CONSTRAINT
--    Prevents stock_quantity from going negative at the DB level.
--    Even if application code has a bug, the DB will reject the
--    write with a constraint violation instead of silently going
--    negative and overselling.
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_stock_quantity_non_negative'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_stock_quantity_non_negative
      CHECK (stock_quantity >= 0);
  END IF;
END
$$;

-- Same constraint for the BOGOProduct snapshot table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bogo_products') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'bogo_products_stock_quantity_non_negative'
    ) THEN
      ALTER TABLE bogo_products
        ADD CONSTRAINT bogo_products_stock_quantity_non_negative
        CHECK (stock_quantity >= 0);
    END IF;
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. PRODUCT PERFORMANCE INDEXES
--    These columns appear in WHERE / ORDER BY clauses but have
--    no index, causing full-table scans.
-- ─────────────────────────────────────────────────────────────

-- Products: isNew / "recently added" filter (30-day window)
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products (created_at DESC);

-- Products: price range filtering and sorting
CREATE INDEX IF NOT EXISTS idx_products_final_price
  ON products (final_price);

-- Products: active + deleted filter (most public queries use both)
CREATE INDEX IF NOT EXISTS idx_products_active_deleted
  ON products (is_active, deleted_at);

-- Products: stock availability (low-stock dashboard queries)
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity
  ON products (stock_quantity);

-- ─────────────────────────────────────────────────────────────
-- 3. ORDER PERFORMANCE INDEXES
--    Revenue reports, admin dashboards, payment status polling
--    all query orders by date/status.
-- ─────────────────────────────────────────────────────────────

-- Orders: revenue by date range (daily/monthly reports)
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

-- Orders: payment status polling (success/failed page polls this)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON orders (payment_status);

-- Orders: status filter (admin order management)
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (status);

-- Orders: user lookup (order history page)
CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. PAYMENT INDEXES
--    Webhook handler and verify endpoint look up payments by
--    transaction_id (razorpay order_id).  Without an index
--    this is a full-table scan on every payment event.
-- ─────────────────────────────────────────────────────────────

-- Payments: webhook lookup by Razorpay order ID
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id
  ON payments (transaction_id);

-- Payments: status filter (reconciliation queries)
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments (status);

-- Payments: order_id FK lookup
CREATE INDEX IF NOT EXISTS idx_payments_order_id
  ON payments (order_id);

-- ─────────────────────────────────────────────────────────────
-- 5. INVENTORY LOCK INDEXES
--    Locks are queried per product + expiry on every checkout.
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_inventory_locks_product_expiry
  ON inventory_locks (product_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_inventory_locks_order_id
  ON inventory_locks (order_id);

-- ─────────────────────────────────────────────────────────────
-- 6. USER INDEXES
--    Auth middleware and login look up users by email constantly.
-- ─────────────────────────────────────────────────────────────

-- Email lookup on login (should already be unique, but ensure index)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

-- ─────────────────────────────────────────────────────────────
-- Verify constraints and indexes applied
-- ─────────────────────────────────────────────────────────────
-- To verify after migration:
--   SELECT conname, contype FROM pg_constraint WHERE conrelid = 'products'::regclass;
--   SELECT indexname FROM pg_indexes WHERE tablename = 'products';
