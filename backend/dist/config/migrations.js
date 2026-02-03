"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPendingMigrations = runPendingMigrations;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
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
        // Run prisma migrate deploy
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
            cwd: process.cwd(),
            env: {
                ...process.env,
                // Use DATABASE_URL for pooled connections
                // Prisma will use DIRECT_URL automatically if set for migrations
            },
        });
        if (stdout) {
            console.log('[Migration] ✅ Migrations applied successfully');
            console.log('[Migration]', stdout.split('\n')[0]);
        }
        if (stderr && !stderr.includes('No pending migrations to apply')) {
            // Only log as warning if it's not the "no migrations" message
            if (!stderr.includes('already applied')) {
                console.warn('[Migration] ⚠️  Migration warning:', stderr);
            }
        }
        return true;
    }
    catch (error) {
        // Migrations might fail if DB is not ready yet, that's ok
        // DB will retry on next request
        const errorMsg = error.message || String(error);
        if (errorMsg.includes('connect ECONNREFUSED')) {
            console.log('[Migration] ⚠️  Database not ready yet (will retry on first request)');
            return false;
        }
        if (errorMsg.includes('Authentication failed')) {
            console.log('[Migration] ⚠️  Database authentication failed (check DATABASE_URL and DIRECT_URL)');
            return false;
        }
        if (errorMsg.includes('already applied')) {
            console.log('[Migration] ✅ All migrations already applied');
            return true;
        }
        console.error('[Migration] ❌ Migration error:', errorMsg.split('\n')[0]);
        // Don't fail startup if migrations error - they might apply later
        return false;
    }
}
//# sourceMappingURL=migrations.js.map