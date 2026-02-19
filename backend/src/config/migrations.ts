import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from './database';

const execAsync = promisify(exec);

/**
 * Apply password_hash nullable migration directly via raw SQL
 */
async function applyPasswordHashMigration(retries: number = 5): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Migration] 🔍 Attempt ${attempt}/${retries}: Checking password_hash constraint...`);

      // Try the migration directly with proper PostgreSQL syntax
      // Use a simple ALTER TABLE command that works with both pooled and direct connections
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`
      );
      
      console.log('[Migration] ✅ password_hash constraint dropped successfully');
      return true;
    } catch (error: any) {
      const errorMsg = (error.message || String(error)).toLowerCase();
      
      // Check if the migration is already applied
      if (errorMsg.includes('syntax') || errorMsg.includes('constraint') || errorMsg.includes('does not exist')) {
        // Try to verify the current state
        try {
          const result = await prisma.$queryRawUnsafe(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password_hash'
            LIMIT 1
          `) as any[];

          if (result && result.length > 0) {
            if (result[0].is_nullable === 'YES') {
              console.log('[Migration] ✅ password_hash is already nullable');
              return true;
            } else {
              console.log('[Migration] ℹ️  password_hash is NOT NULL - will retry');
            }
          }
        } catch (checkError) {
          console.log(`[Migration] ⚠️  Could not verify column state`);
        }
      }

      if (attempt < retries) {
        const waitTime = 2000;
        console.log(`[Migration] ⏳ Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('[Migration] ❌ Migration failed after', retries, 'attempts');
        console.error('[Migration] Error:', errorMsg.split('\n')[0]);
      }
    }
  }

  return false;
}

// ============================================================
// PHASE 0: SECURITY HARDENING MIGRATION
// Applies on every startup — idempotent (IF NOT EXISTS guards)
// ============================================================
async function applyPhase0SecurityMigration(): Promise<void> {
  try {
    // 1. Stock floor constraint — prevents negative inventory at DB level
    await prisma.$executeRawUnsafe(`
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
      $$
    `);
    console.log('[Migration:Phase0] ✅ Stock non-negative constraint: OK');

    // 2. Critical performance indexes
    const indexes: Array<[string, string]> = [
      ['idx_products_created_at',   'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC)'],
      ['idx_products_final_price',   'CREATE INDEX IF NOT EXISTS idx_products_final_price ON products (final_price)'],
      ['idx_products_active_deleted','CREATE INDEX IF NOT EXISTS idx_products_active_deleted ON products (is_active, deleted_at)'],
      ['idx_products_stock_quantity','CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products (stock_quantity)'],
      ['idx_orders_created_at',      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)'],
      ['idx_orders_payment_status',  'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status)'],
      ['idx_orders_status',          'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)'],
      ['idx_orders_user_id',         'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id)'],
      ['idx_payments_transaction_id','CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments (transaction_id)'],
      ['idx_payments_status',        'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status)'],
      ['idx_payments_order_id',      'CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id)'],
      ['idx_inventory_locks_product_expiry', 'CREATE INDEX IF NOT EXISTS idx_inventory_locks_product_expiry ON inventory_locks (product_id, expires_at)'],
      ['idx_inventory_locks_order_id','CREATE INDEX IF NOT EXISTS idx_inventory_locks_order_id ON inventory_locks (order_id)'],
      ['idx_users_email',            'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)'],
    ];

    for (const [name, sql] of indexes) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (idxErr: any) {
        // Non-fatal — index may already exist under a different name or table may differ
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Migration:Phase0] ⚠️  Index ${name}: ${idxErr.message?.split('\n')[0]}`);
        }
      }
    }
    console.log('[Migration:Phase0] ✅ Performance indexes: OK');
  } catch (err: any) {
    // Non-fatal — log and continue. Constraints/indexes are best-effort at startup.
    console.error('[Migration:Phase0] ⚠️  Phase 0 migration partial failure:', err.message?.split('\n')[0]);
  }
}

// ============================================================
// PHASE 2: REVENUE ENGINES MIGRATION
// Applies on every startup — idempotent (IF NOT EXISTS guards)
// ============================================================
async function applyPhase2RevenueMigration(): Promise<void> {
  try {
    // 1. Add low_stock_alert_sent_at column to products
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "low_stock_alert_sent_at" TIMESTAMP(3)
    `);

    // 2. Create abandoned_cart_logs table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "abandoned_cart_logs" (
        "id"            TEXT NOT NULL,
        "user_id"       TEXT NOT NULL,
        "email_sent_at" TIMESTAMP(3) NOT NULL,
        "cart_total"    DOUBLE PRECISION NOT NULL,
        "item_count"    INTEGER NOT NULL,
        "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    TIMESTAMP(3) NOT NULL,
        CONSTRAINT "abandoned_cart_logs_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "abandoned_cart_logs_user_id_key"
        ON "abandoned_cart_logs"("user_id")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "abandoned_cart_logs_email_sent_at_idx"
        ON "abandoned_cart_logs"("email_sent_at")
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'abandoned_cart_logs_user_id_fkey'
        ) THEN
          ALTER TABLE "abandoned_cart_logs"
            ADD CONSTRAINT "abandoned_cart_logs_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    // 3. Create payment_retry_tokens table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "payment_retry_tokens" (
        "id"         TEXT NOT NULL,
        "order_id"   TEXT NOT NULL,
        "token"      TEXT NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "used"       BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "payment_retry_tokens_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "payment_retry_tokens_token_key"
        ON "payment_retry_tokens"("token")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "payment_retry_tokens_token_idx"
        ON "payment_retry_tokens"("token")
    `);
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'payment_retry_tokens_order_id_fkey'
        ) THEN
          ALTER TABLE "payment_retry_tokens"
            ADD CONSTRAINT "payment_retry_tokens_order_id_fkey"
            FOREIGN KEY ("order_id") REFERENCES "orders"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `);

    console.log('[Migration:Phase2] ✅ Revenue engines schema: OK');
  } catch (err: any) {
    console.error('[Migration:Phase2] ⚠️  Phase 2 migration partial failure:', err.message?.split('\n')[0]);
  }
}

// ============================================================
// PHASE 3: ANALYTICS INDEXES
// Composite indexes for fast aggregation queries
// ============================================================
async function applyPhase3AnalyticsIndexes(): Promise<void> {
  const indexes: Array<[string, string]> = [
    // Orders — analytics queries filter by paymentStatus + createdAt heavily
    ['idx_orders_payment_status_created', 'CREATE INDEX IF NOT EXISTS idx_orders_payment_status_created ON orders (payment_status, created_at DESC)'],
    ['idx_orders_user_status',            'CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, payment_status)'],
    // Payments — success/failure rate queries
    ['idx_payments_status_created',       'CREATE INDEX IF NOT EXISTS idx_payments_status_created ON payments (status, created_at DESC)'],
    // Order items — product revenue aggregation
    ['idx_order_items_product_id',        'CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id)'],
    // Coupons — usage tracking
    ['idx_coupon_usage_coupon_id',        'CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usages (coupon_id)'],
    // Cart items — abandoned cart queries
    ['idx_cart_items_user_added',         'CREATE INDEX IF NOT EXISTS idx_cart_items_user_added ON cart_items (user_id, added_at DESC)'],
  ];

  try {
    for (const [, sql] of indexes) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        // Non-fatal — index may already exist
      }
    }
    console.log('[Migration:Phase3] ✅ Analytics indexes: OK');
  } catch (err: any) {
    console.error('[Migration:Phase3] ⚠️  Phase 3 indexes partial failure:', err.message?.split('\n')[0]);
  }
}

/**
 * Fallback: Apply critical migrations manually if prisma migrate fails
 */
export async function runPendingMigrations(): Promise<boolean> {
  try {
    console.log('[Migration] ⏳ Applying password_hash nullable migration...');
    
    // Try the manual migration first (most reliable)
    const manualSuccess = await applyPasswordHashMigration();

    // Phase 0 security hardening — always runs (idempotent)
    console.log('[Migration] ⏳ Applying Phase 0 security hardening...');
    await applyPhase0SecurityMigration();

    // Phase 2 revenue engines — always runs (idempotent)
    console.log('[Migration] ⏳ Applying Phase 2 revenue engines...');
    await applyPhase2RevenueMigration();

    // Phase 3 analytics indexes — always runs (idempotent)
    console.log('[Migration] ⏳ Applying Phase 3 analytics indexes...');
    await applyPhase3AnalyticsIndexes();

    if (manualSuccess) {
      return true;
    }

    // If manual migration fails, try prisma migrate deploy as fallback
    console.log('[Migration] 📦 Trying prisma migrate deploy as secondary method...');
    try {
      const { stdout } = await execAsync('npx prisma migrate deploy', {
        cwd: process.cwd(),
        timeout: 30000,
      });

      if (stdout) {
        console.log('[Migration] ✅ Migrations applied via prisma migrate deploy');
        return true;
      }

      return true;
    } catch (migrateError) {
      console.log('[Migration] ⚠️  Prisma migrate deploy did not apply migrations');
      return false;
    }
  } catch (error: any) {
    console.error('[Migration] ❌ Migration error:', (error.message || String(error)).split('\n')[0]);
    return false;
  }
}

