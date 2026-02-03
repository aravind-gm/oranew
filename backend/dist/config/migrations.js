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
async function applyPasswordHashMigration() {
    try {
        console.log('[Migration] 🔍 Checking password_hash column constraint...');
        // First, check the current constraint status
        const checkResult = await database_1.prisma.$queryRaw `
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'password_hash'
    `;
        if (!checkResult || checkResult.length === 0) {
            console.log('[Migration] ℹ️  password_hash column not found (schema mismatch?)');
            return false;
        }
        const column = checkResult[0];
        console.log(`[Migration] Column status: ${column.column_name} (${column.data_type}), nullable=${column.is_nullable}`);
        if (column.is_nullable === 'YES') {
            console.log('[Migration] ✅ password_hash is already nullable - no action needed');
            return true;
        }
        // Apply the migration
        console.log('[Migration] ⏳ Applying: ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
        await database_1.prisma.$executeRawUnsafe('ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL');
        console.log('[Migration] ✅ Successfully made password_hash nullable');
        return true;
    }
    catch (error) {
        const errorMsg = error.message || String(error);
        console.error('[Migration] ❌ Error:', errorMsg);
        return false;
    }
}
/**
 * Fallback: Apply critical migrations manually if prisma migrate fails
 * This handles cases where prisma can't authenticate with the database
 */
async function applyManualMigrations(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[Migration] 🔧 Attempt ${attempt}/${retries}: Applying manual migrations...`);
            const success = await applyPasswordHashMigration();
            if (success) {
                return;
            }
            if (attempt < retries) {
                console.log(`[Migration] ⏳ Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        catch (error) {
            const errorMsg = error.message || String(error);
            console.error(`[Migration] ⚠️  Attempt ${attempt} failed:`, errorMsg.split('\n')[0]);
            if (attempt < retries) {
                console.log(`[Migration] ⏳ Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    console.log('[Migration] ⚠️  Manual migration completed (with possible errors)');
}
/**
 * Automatically run pending migrations at server startup
 * This ensures the database schema is always up-to-date
 */
async function runPendingMigrations() {
    try {
        console.log('[Migration] ⏳ Checking for pending migrations...');
        // Only run if we have database credentials
        if (!process.env.DATABASE_URL) {
            console.log('[Migration] ⚠️  DATABASE_URL not set, skipping migrations');
            return false;
        }
        // Try prisma migrate deploy first
        try {
            const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
                cwd: process.cwd(),
                env: {
                    ...process.env,
                },
                timeout: 30000, // 30 second timeout
            });
            if (stdout && stdout.includes('applied')) {
                console.log('[Migration] ✅ Migrations applied via prisma migrate deploy');
                return true;
            }
            if (stdout && stdout.includes('No pending migrations')) {
                console.log('[Migration] ℹ️  No pending migrations to apply');
                return true;
            }
            if (stderr && !stderr.includes('already applied')) {
                console.warn('[Migration] ⚠️  Prisma migrate output:', stderr.split('\n')[0]);
            }
            return true;
        }
        catch (migrateError) {
            console.log('[Migration] ⚠️  Prisma migrate deploy failed, trying manual fallback...');
            // Fallback: Apply migrations manually
            await applyManualMigrations();
            return true;
        }
    }
    catch (error) {
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('connect ECONNREFUSED')) {
            console.log('[Migration] ⚠️  Database not ready yet (will retry on first request)');
            return false;
        }
        if (errorMsg.includes('Authentication failed')) {
            console.log('[Migration] ⚠️  Database authentication failed, attempting manual migration...');
            try {
                await applyManualMigrations();
                return true;
            }
            catch (_) {
                return false;
            }
        }
        console.error('[Migration] ❌ Migration error:', errorMsg.split('\n')[0]);
        // Don't fail startup if migrations error - they might apply later
        return false;
    }
}
//# sourceMappingURL=migrations.js.map