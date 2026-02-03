"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthDetailed = exports.health = void 0;
const database_1 = require("../config/database");
// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
// This endpoint is critical for:
// 1. Render health checks (knows when service is ready)
// 2. DB warmup on cold start (called during startup)
// 3. Monitoring uptime (check every 5 minutes)
// 4. Debugging connection issues
//
// Returns:
// - 200 OK: Service is healthy
// - 503 Unavailable: DB not responding
const health = async (req, res, next) => {
    try {
        const isDbHealthy = await (0, database_1.checkDatabaseHealth)();
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: isDbHealthy ? 'connected' : 'disconnected',
            version: process.env.APP_VERSION || '1.0.0',
        };
        // Return 200 if everything is OK
        if (isDbHealthy) {
            return res.status(200).json(response);
        }
        // Return 503 if DB is down (but service is running)
        return res.status(503).json(response);
    }
    catch (error) {
        console.error('[Health] Unexpected error:', error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.health = health;
// ============================================
// DETAILED HEALTH CHECK (Admin only)
// ============================================
// More detailed diagnostics for debugging
// Requires authentication
const healthDetailed = async (req, res, next) => {
    try {
        const isDbHealthy = await (0, database_1.checkDatabaseHealth)();
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: {
                connected: isDbHealthy,
                checkedAt: new Date().toISOString(),
            },
            environment: {
                nodeEnv: process.env.NODE_ENV,
                port: process.env.PORT || 5000,
            },
        };
        return res.status(isDbHealthy ? 200 : 503).json(response);
    }
    catch (error) {
        console.error('[Health] Detailed check error:', error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.healthDetailed = healthDetailed;
//# sourceMappingURL=health.controller.js.map