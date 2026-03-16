/**
 * Redis Client — Phase 4
 * =======================
 *
 * Shared Redis connection for:
 *  - API response caching (product lists, categories)
 *  - Analytics cache (replaces in-memory Map)
 *  - Rate limiter store (production-safe, survives restarts)
 *  - BullMQ job queue connection
 *  - Abandoned cart cooldown tracking
 *
 * Graceful degradation:
 *  - If REDIS_URL is not set, all cache operations silently no-op
 *  - The app works identically, just without caching
 *  - This means Phase 4 is safe to deploy before Redis is provisioned
 */
import Redis from 'ioredis';
/**
 * Get the shared Redis client.
 * Returns null if Redis is not configured or not connected.
 */
export declare function getRedis(): Redis | null;
/**
 * Initialize Redis connection. Call once at server startup.
 * Safe to call even if REDIS_URL is not set — will silently skip.
 * Singleton-safe: calling multiple times returns existing connection.
 */
export declare function initRedis(): Promise<boolean>;
/**
 * Get a cached value. Tries Redis first, falls back to in-memory.
 */
export declare function cacheGet<T>(key: string): Promise<T | null>;
/**
 * Set a cached value with TTL (seconds).
 * Writes to both Redis and in-memory (dual-write for safety).
 */
export declare function cacheSet<T>(key: string, data: T, ttlSeconds?: number): Promise<void>;
/**
 * Delete a cached key (invalidation).
 */
export declare function cacheDel(key: string): Promise<void>;
/**
 * Delete all keys matching a pattern (e.g., 'products:*').
 * Use for bulk cache invalidation when admin updates products.
 */
export declare function cacheDelPattern(pattern: string): Promise<void>;
/**
 * Cleanup expired in-memory cache entries.
 * Called periodically to prevent memory leaks.
 */
export declare function cleanupMemCache(): void;
//# sourceMappingURL=redis.d.ts.map