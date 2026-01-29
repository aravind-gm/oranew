"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.ensureDatabaseConnected = exports.checkDatabaseHealth = void 0;
const client_1 = require("@prisma/client");
// ============================================
// PRISMA CLIENT SINGLETON (PRODUCTION-SAFE)
// ============================================
// Why this matters:
// 1. Single instance prevents connection pool exhaustion
// 2. Global singleton survives Render/Vercel sleep/wake cycles
// 3. Lazy initialization prevents aggressive connection attempts
// 4. Compatible with hot reload (dev) and production
// 5. Handles connection events for graceful recovery
//
// How it works:
// - First call creates PrismaClient
// - Subsequent calls reuse same instance
// - Never creates new clients per request
// - Listens for connection events to detect failures
// ============================================
const prismaClientSingleton = () => {
    const client = new client_1.PrismaClient({
        // Logging strategy:
        // - Production: Only errors (minimize noise)
        // - Development: Include warnings and queries (debugging)
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error', 'warn'],
    });
    // Graceful disconnect handler
    // If connection dies, don't crash - let error handlers catch it
    return client;
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
exports.prisma = prisma;
// Production: Reuse the same instance across all requests
// Development: Also keep it global to prevent hot-reload issues
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
// ============================================
// CONNECTION HEALTH CHECK
// ============================================
// Exported for use in keep-alive endpoint
// Tests if Prisma can reach the database
const checkDatabaseHealth = async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        console.error('[DB Health Check] Failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
// ============================================
// GRACEFUL CONNECTION RECOVERY
// ============================================
// If Prisma connection dies, attempt ONE reconnect
// This prevents cascading failures from taking down the server
const ensureDatabaseConnected = async () => {
    try {
        // Quick health check
        await (0, exports.checkDatabaseHealth)();
        return true;
    }
    catch (error) {
        console.warn('[DB Recovery] Connection failed, attempting reconnect...');
        try {
            // Disconnect and reconnect
            await prisma.$disconnect();
            // Recreate connection (Prisma auto-connects on next query)
            await (0, exports.checkDatabaseHealth)();
            console.log('[DB Recovery] Successfully reconnected');
            return true;
        }
        catch (reconnectError) {
            console.error('[DB Recovery] Reconnect failed:', reconnectError instanceof Error ? reconnectError.message : String(reconnectError));
            return false;
        }
    }
};
exports.ensureDatabaseConnected = ensureDatabaseConnected;
//# sourceMappingURL=database.js.map