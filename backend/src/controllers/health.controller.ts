import { Request, Response, NextFunction } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { getRedis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';

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

export const health = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isDbHealthy = await checkDatabaseHealth();

    const response = {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: isDbHealthy ? 'connected' as const : 'disconnected' as const,
      version: process.env.APP_VERSION || '1.0.0',
    };

    // Return 200 if everything is OK
    if (isDbHealthy) {
      return res.status(200).json(response);
    }

    // Return 503 if DB is down (but service is running)
    return res.status(503).json(response);
  } catch (error) {
    console.error('[Health] Unexpected error:', error instanceof Error ? error.message : String(error));
    next(error);
  }
};

// ============================================
// DETAILED HEALTH CHECK (Admin only)
// ============================================
// More detailed diagnostics for debugging
// Requires authentication

export const healthDetailed = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const isDbHealthy = await checkDatabaseHealth();

    const response = {
      status: 'ok' as const,
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
  } catch (error) {
    console.error('[Health] Detailed check error:', error instanceof Error ? error.message : String(error));
    next(error);
  }
};

// ============================================
// SYSTEM DIAGNOSTICS (Admin panel widget)
// ============================================
// Comprehensive system health for the admin dashboard
// Returns: DB, Redis, memory, uptime, queue info

export const systemDiagnostics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Database
    const isDbHealthy = await checkDatabaseHealth();

    // 2. Redis
    const redis = getRedis();
    let redisInfo: Record<string, any> = { connected: false };
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
      } catch {
        redisInfo = { connected: true, usedMemory: 'N/A', peakMemory: 'N/A', keys: 0 };
      }
    }

    // 3. BullMQ queue stats (if Redis is available)
    let queueStats: Record<string, any> = { available: false };
    if (redis) {
      try {
        const { Queue } = await import('bullmq');
        const queue = new Queue('ora-background', {
          connection: redis.duplicate() as any,
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
      } catch {
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
      status: 'ok' as const,
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
  } catch (error) {
    console.error('[Health] System diagnostics error:', error instanceof Error ? error.message : String(error));
    next(error);
  }
};
