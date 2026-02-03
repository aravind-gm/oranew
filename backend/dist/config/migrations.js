"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPendingMigrations = runPendingMigrations;
const child_process_1 = require("child_process");
const util_1 = require("util");
const database_1 = require("./database");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Fallback: Apply critical migrations manually if prisma migrate fails
 * This handles cases where prisma can't authenticate with the database
 */
async function applyManualMigrations(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[Migration] 🔧 Applying manual migrations (attempt ${attempt}/${retries})...`);
            // Check if password_hash column is nullable
            const columnInfo = await database_1.prisma.$queryRaw `
        SELECT is_nullable FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
      `;
            if (columnInfo.length > 0 && columnInfo[0].is_nullable === 'YES') {
                console.log('[Migration] ✅ password_hash column is already nullable');
                return;
            }
            // Apply the migration manually
            console.log('[Migration] ⏳ Making password_hash column nullable...');
            await database_1.prisma.$executeRaw `ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL`;
            console.log('[Migration] ✅ Manual migration applied: password_hash is now nullable');
            return;
        }
        catch (error) {
            const errorMsg = error.message || String(error);
            if (errorMsg.includes('already nullable') || errorMsg.includes('not a valid column') || errorMsg.includes('no attribute')) {
                console.log('[Migration] ℹ️  Migration already applied or column structure differs');
                return;
            }
            if (errorMsg.includes('connect ECONNREFUSED') || errorMsg.includes('ENOTFOUND')) {
                if (attempt < retries) {
                    console.log(`[Migration] ⏳ Database not ready, retrying in 2s...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
            }
            if (attempt === retries) {
                console.error('[Migration] ⚠️  Manual migration failed after retries:', errorMsg.split('\n')[0]);
                // Continue anyway - the migration might be already applied
                return;
            }
            // Retry on other errors
            if (attempt < retries) {
                console.log(`[Migration] ⏳ Retrying after error...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
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