"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warmupDatabase = exports.ensureDatabaseConnected = exports.checkDatabaseHealth = exports.prisma = void 0;
const client_1 = require("@prisma/client");
// ============================================
// PRISMA CLIENT SINGLETON (PRODUCTION-SAFE)
// ============================================
// WHY THIS MATTERS (Root cause of 500 errors):
//
// Problem Without Singleton:
// 1. Each request creates NEW PrismaClient instance
// 2. Each instance tries to open DB connection
// 3. On Render cold start: rapid reconnect attempts
// 4. Connection pool exhausts → "too many connections"
// 5. All requests fail with 500 error
//
// Solution With Singleton:
// 1. ONE PrismaClient per process (across all requests)
// 2. Connection pool reused → no exhaustion
// 3. Handles reconnection gracefully
// 4. Compatible with hot-reload (dev) and production
// 5. Zero startup overhead
//
// How It Works:
// - Global singleton pattern via globalThis
// - First call creates PrismaClient with optimized config
// - Subsequent calls reuse same instance
// - Connection pooling prevents "too many connections"
// - Error handlers allow graceful recovery
// ============================================
let globalPrisma;
const getPrismaClient = () => {
    if (globalPrisma) {
        return globalPrisma;
    }
    console.log('[DB] 🔌 Initializing Prisma Client (Singleton)...');
    globalPrisma = new client_1.PrismaClient({
        // Logging configuration
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error', 'warn'],
        errorFormat: 'pretty',
    });
    return globalPrisma;
};
// Ensure we use the singleton
exports.prisma = globalThis.prisma || getPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = exports.prisma;
}
// ============================================
// CONNECTION HEALTH CHECK
// ============================================
// Tests if Prisma can reach the database
// Used by /api/health endpoint and warmup logic
// 
// Why this is critical:
// - On Render cold start, DB might not be ready
// - We need to wait for DB before handling requests
// - Health check is fast and safe to call repeatedly
const checkDatabaseHealth = async () => {
    try {
        // Simple query to verify connectivity
        await exports.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('[DB Health Check] ❌ Failed:', {
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
// ============================================
// SAFE DATABASE CONNECTION WITH RECONNECT
// ============================================
// This function:
// 1. Checks if database is reachable
// 2. If not, attempts ONE reconnect
// 3. Returns true/false for connection status
//
// Used when:
// - Server starts up (wait for DB to be ready)
// - After detecting connection error (recover gracefully)
// - Health check endpoints (monitor uptime)
//
// WHY NOT AUTOMATIC RECONNECT ON EVERY ERROR:
// - Prevents connection storm on cold start
// - Allows explicit error handling at application level
// - Gives caller control over retry backoff strategy
const ensureDatabaseConnected = async () => {
    try {
        // First check: is DB reachable?
        const isHealthy = await (0, exports.checkDatabaseHealth)();
        if (isHealthy) {
            return true;
        }
        // Second check: attempt ONE reconnection
        console.warn('[DB Recovery] 🔄 Connection lost, attempting recovery...');
        try {
            // Disconnect existing connection to reset state
            await exports.prisma.$disconnect();
            console.log('[DB Recovery] ✅ Disconnected old connection');
            // Recreate Prisma client (will auto-connect on next query)
            // Note: This would require recreating the singleton
            // For now, just verify health improved
            const recovered = await (0, exports.checkDatabaseHealth)();
            if (recovered) {
                console.log('[DB Recovery] ✅ Database connection recovered');
                return true;
            }
            else {
                console.error('[DB Recovery] ❌ Database still unreachable after recovery attempt');
                return false;
            }
        }
        catch (reconnectError) {
            console.error('[DB Recovery] ❌ Reconnection failed:', {
                message: reconnectError instanceof Error ? reconnectError.message : String(reconnectError),
            });
            return false;
        }
    }
    catch (error) {
        console.error('[DB Recovery] 🔴 Unexpected error:', {
            message: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
};
exports.ensureDatabaseConnected = ensureDatabaseConnected;
// ============================================
// STARTUP WARMUP
// ============================================
// Call this in server.ts on startup
// Ensures DB is ready before accepting requests
// On Render cold start: waits up to 30 seconds for DB
const warmupDatabase = async (maxWaitMs = 30000) => {
    const startTime = Date.now();
    const pollIntervalMs = 1000; // Check every 1 second
    console.log('[DB Warmup] 🔥 Starting database warmup...');
    while (Date.now() - startTime < maxWaitMs) {
        try {
            const isHealthy = await (0, exports.checkDatabaseHealth)();
            if (isHealthy) {
                const elapsedMs = Date.now() - startTime;
                console.log(`[DB Warmup] ✅ Database ready in ${elapsedMs}ms`);
                return true;
            }
        }
        catch (error) {
            // Warmup check failed, will retry
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    // Timeout reached
    console.error(`[DB Warmup] ❌ Database not ready after ${maxWaitMs}ms`);
    return false;
};
exports.warmupDatabase = warmupDatabase;
exports.default = exports.prisma;
//# sourceMappingURL=database.js.map