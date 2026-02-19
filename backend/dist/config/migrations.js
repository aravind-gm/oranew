"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPendingMigrations = runPendingMigrations;
const child_process_1 = require("child_process");
const util_1 = require("util");
const database_1 = require("./database");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Apply password_hash nullable migration directly via raw SQL
 */
async function applyPasswordHashMigration(retries = 5) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[Migration] 🔍 Attempt ${attempt}/${retries}: Checking password_hash constraint...`);
            // Try the migration directly with proper PostgreSQL syntax
            // Use a simple ALTER TABLE command that works with both pooled and direct connections
            await database_1.prisma.$executeRawUnsafe(`ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`);
            console.log('[Migration] ✅ password_hash constraint dropped successfully');
            return true;
        }
        catch (error) {
            const errorMsg = (error.message || String(error)).toLowerCase();
            // Check if the migration is already applied
            if (errorMsg.includes('syntax') || errorMsg.includes('constraint') || errorMsg.includes('does not exist')) {
                // Try to verify the current state
                try {
                    const result = await database_1.prisma.$queryRawUnsafe(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password_hash'
            LIMIT 1
          `);
                    if (result && result.length > 0) {
                        if (result[0].is_nullable === 'YES') {
                            console.log('[Migration] ✅ password_hash is already nullable');
                            return true;
                        }
                        else {
                            console.log('[Migration] ℹ️  password_hash is NOT NULL - will retry');
                        }
                    }
                }
                catch (checkError) {
                    console.log(`[Migration] ⚠️  Could not verify column state`);
                }
            }
            if (attempt < retries) {
                const waitTime = 2000;
                console.log(`[Migration] ⏳ Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            else {
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
async function applyPhase0SecurityMigration() {
    try {
        // 1. Stock floor constraint — prevents negative inventory at DB level
        await database_1.prisma.$executeRawUnsafe(`
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
        const indexes = [
            ['idx_products_created_at', 'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC)'],
            ['idx_products_final_price', 'CREATE INDEX IF NOT EXISTS idx_products_final_price ON products (final_price)'],
            ['idx_products_active_deleted', 'CREATE INDEX IF NOT EXISTS idx_products_active_deleted ON products (is_active, deleted_at)'],
            ['idx_products_stock_quantity', 'CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products (stock_quantity)'],
            ['idx_orders_created_at', 'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC)'],
            ['idx_orders_payment_status', 'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status)'],
            ['idx_orders_status', 'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)'],
            ['idx_orders_user_id', 'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id)'],
            ['idx_payments_transaction_id', 'CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments (transaction_id)'],
            ['idx_payments_status', 'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status)'],
            ['idx_payments_order_id', 'CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id)'],
            ['idx_inventory_locks_product_expiry', 'CREATE INDEX IF NOT EXISTS idx_inventory_locks_product_expiry ON inventory_locks (product_id, expires_at)'],
            ['idx_inventory_locks_order_id', 'CREATE INDEX IF NOT EXISTS idx_inventory_locks_order_id ON inventory_locks (order_id)'],
            ['idx_users_email', 'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)'],
        ];
        for (const [name, sql] of indexes) {
            try {
                await database_1.prisma.$executeRawUnsafe(sql);
            }
            catch (idxErr) {
                // Non-fatal — index may already exist under a different name or table may differ
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[Migration:Phase0] ⚠️  Index ${name}: ${idxErr.message?.split('\n')[0]}`);
                }
            }
        }
        console.log('[Migration:Phase0] ✅ Performance indexes: OK');
    }
    catch (err) {
        // Non-fatal — log and continue. Constraints/indexes are best-effort at startup.
        console.error('[Migration:Phase0] ⚠️  Phase 0 migration partial failure:', err.message?.split('\n')[0]);
    }
}
/**
 * Fallback: Apply critical migrations manually if prisma migrate fails
 */
async function runPendingMigrations() {
    try {
        console.log('[Migration] ⏳ Applying password_hash nullable migration...');
        // Try the manual migration first (most reliable)
        const manualSuccess = await applyPasswordHashMigration();
        // Phase 0 security hardening — always runs (idempotent)
        console.log('[Migration] ⏳ Applying Phase 0 security hardening...');
        await applyPhase0SecurityMigration();
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
        }
        catch (migrateError) {
            console.log('[Migration] ⚠️  Prisma migrate deploy did not apply migrations');
            return false;
        }
    }
    catch (error) {
        console.error('[Migration] ❌ Migration error:', (error.message || String(error)).split('\n')[0]);
        return false;
    }
}
//# sourceMappingURL=migrations.js.map