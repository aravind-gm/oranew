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
/**
 * Fallback: Apply critical migrations manually if prisma migrate fails
 */
async function runPendingMigrations() {
    try {
        console.log('[Migration] ⏳ Applying password_hash nullable migration...');
        // Try the manual migration first (most reliable)
        const manualSuccess = await applyPasswordHashMigration();
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