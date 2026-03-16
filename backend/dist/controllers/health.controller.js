"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemDiagnostics = exports.healthDetailed = exports.health = void 0;
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
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
// ============================================
// SYSTEM DIAGNOSTICS (Admin panel widget)
// ============================================
// Comprehensive system health for the admin dashboard
// Returns: DB, Redis, memory, uptime, queue info
const systemDiagnostics = async (req, res, next) => {
    try {
        // 1. Database
        const isDbHealthy = await (0, database_1.checkDatabaseHealth)();
        // 2. Redis
        const redis = (0, redis_1.getRedis)();
        let redisInfo = { connected: false };
        if (redis) {
            try {
                const info = await redis.info('memory');
                const usedMemMatch = info.match(/used_memory_human:(\S+)/);
                const peakMemMatch = info.match(/used_memory_peak_human:(\S+)/);
                const keyCount = await redis.dbsize();
                redisInfo = {
                    connected: true,
                    usedMemory: usedMemMatch ? usedMemMatch[1] : 'N/A',
                    peakMemory: peakMemMatch ? peakMemMatch[1] : 'N/A',
                    keys: keyCount,
                };
            }
            catch {
                redisInfo = { connected: true, usedMemory: 'N/A', peakMemory: 'N/A', keys: 0 };
            }
        }
        // 3. BullMQ queue stats (if Redis is available)
        let queueStats = { available: false };
        if (redis) {
            try {
                const { Queue } = await Promise.resolve().then(() => __importStar(require('bullmq')));
                const queue = new Queue('ora-background', {
                    connection: redis.duplicate(),
                });
                const [waiting, active, completed, failed, delayed] = await Promise.all([
                    queue.getWaitingCount(),
                    queue.getActiveCount(),
                    queue.getCompletedCount(),
                    queue.getFailedCount(),
                    queue.getDelayedCount(),
                ]);
                queueStats = { available: true, waiting, active, completed, failed, delayed };
                await queue.close();
            }
            catch {
                queueStats = { available: false, error: 'Could not query queue' };
            }
        }
        // 4. Process memory & CPU
        const mem = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        // 5. Uptime
        const uptimeSec = process.uptime();
        const days = Math.floor(uptimeSec / 86400);
        const hours = Math.floor((uptimeSec % 86400) / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const response = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: {
                seconds: Math.round(uptimeSec),
                formatted: `${days}d ${hours}h ${minutes}m`,
            },
            database: {
                connected: isDbHealthy,
                checkedAt: new Date().toISOString(),
            },
            redis: redisInfo,
            queue: queueStats,
            memory: {
                rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
                heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
                heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
                external: `${(mem.external / 1024 / 1024).toFixed(1)} MB`,
            },
            cpu: {
                user: `${(cpuUsage.user / 1000).toFixed(0)} ms`,
                system: `${(cpuUsage.system / 1000).toFixed(0)} ms`,
            },
            environment: {
                nodeVersion: process.version,
                nodeEnv: process.env.NODE_ENV || 'development',
                platform: process.platform,
                pid: process.pid,
            },
        };
        return res.status(200).json({ success: true, data: response });
    }
    catch (error) {
        console.error('[Health] System diagnostics error:', error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.systemDiagnostics = systemDiagnostics;
//# sourceMappingURL=health.controller.js.map