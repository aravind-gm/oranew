"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedis = getRedis;
exports.initRedis = initRedis;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
exports.cacheDelPattern = cacheDelPattern;
exports.cleanupMemCache = cleanupMemCache;
const ioredis_1 = __importDefault(require("ioredis"));
// ============================================
// REDIS CONNECTION
// ============================================
let redis = null;
let isRedisReady = false;
/**
 * Get the shared Redis client.
 * Returns null if Redis is not configured or not connected.
 */
function getRedis() {
    return isRedisReady ? redis : null;
}
/**
 * Initialize Redis connection. Call once at server startup.
 * Safe to call even if REDIS_URL is not set — will silently skip.
 * Singleton-safe: calling multiple times returns existing connection.
 */
async function initRedis() {
    // Singleton guard: if already connected, return immediately
    if (redis && isRedisReady) {
        console.log('[Redis] ✅ Already connected (singleton)');
        return true;
    }
    const url = process.env.REDIS_URL;
    if (!url) {
        console.log('[Redis] ⏭️  REDIS_URL not set — caching disabled (in-memory fallback)');
        return false;
    }
    try {
        redis = new ioredis_1.default(url, {
            maxRetriesPerRequest: null, // Required by BullMQ — it manages its own retries
            retryStrategy(times) {
                if (times > 5) {
                    console.error('[Redis] ❌ Max retries reached — giving up');
                    return null; // stop retrying
                }
                return Math.min(times * 500, 3000); // exponential backoff, max 3s
            },
            enableReadyCheck: true,
            connectTimeout: 10000,
            // TLS for managed Redis (Upstash, Redis Cloud, etc.)
            ...(url.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {}),
        });
        redis.on('connect', () => {
            console.log('[Redis] 🔌 Connected');
        });
        redis.on('ready', () => {
            isRedisReady = true;
            console.log('[Redis] ✅ Ready — caching enabled');
        });
        redis.on('error', (err) => {
            // Don't crash the app on Redis errors — degrade gracefully
            if (process.env.NODE_ENV === 'development') {
                console.error('[Redis] ⚠️  Error:', err.message);
            }
        });
        redis.on('close', () => {
            isRedisReady = false;
            console.log('[Redis] 🔴 Connection closed');
        });
        // Wait for ready with timeout
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Redis connection timeout'));
            }, 5000);
            redis.once('ready', () => {
                clearTimeout(timeout);
                resolve();
            });
            redis.once('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
        return true;
    }
    catch (err) {
        console.warn('[Redis] ⚠️  Failed to connect:', err instanceof Error ? err.message : String(err));
        console.log('[Redis] ⏭️  Falling back to in-memory caching');
        redis = null;
        isRedisReady = false;
        return false;
    }
}
// ============================================
// CACHE HELPERS (Redis with in-memory fallback)
// ============================================
// In-memory fallback cache (used when Redis is unavailable)
const memCache = new Map();
/**
 * Get a cached value. Tries Redis first, falls back to in-memory.
 */
async function cacheGet(key) {
    const prefixedKey = `ora:${key}`;
    // Try Redis first
    const client = getRedis();
    if (client) {
        try {
            const val = await client.get(prefixedKey);
            if (val)
                return JSON.parse(val);
            return null;
        }
        catch {
            // Fall through to in-memory
        }
    }
    // In-memory fallback
    const entry = memCache.get(prefixedKey);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        memCache.delete(prefixedKey);
        return null;
    }
    return JSON.parse(entry.data);
}
/**
 * Set a cached value with TTL (seconds).
 * Writes to both Redis and in-memory (dual-write for safety).
 */
async function cacheSet(key, data, ttlSeconds = 60) {
    const prefixedKey = `ora:${key}`;
    const serialized = JSON.stringify(data);
    // Write to Redis
    const client = getRedis();
    if (client) {
        try {
            await client.setex(prefixedKey, ttlSeconds, serialized);
        }
        catch {
            // Non-fatal
        }
    }
    // Always write to in-memory as fallback
    memCache.set(prefixedKey, {
        data: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
}
/**
 * Delete a cached key (invalidation).
 */
async function cacheDel(key) {
    const prefixedKey = `ora:${key}`;
    const client = getRedis();
    if (client) {
        try {
            await client.del(prefixedKey);
        }
        catch {
            // Non-fatal
        }
    }
    memCache.delete(prefixedKey);
}
/**
 * Delete all keys matching a pattern (e.g., 'products:*').
 * Use for bulk cache invalidation when admin updates products.
 */
async function cacheDelPattern(pattern) {
    const prefixedPattern = `ora:${pattern}`;
    const client = getRedis();
    if (client) {
        try {
            const keys = await client.keys(prefixedPattern);
            if (keys.length > 0) {
                await client.del(...keys);
            }
        }
        catch {
            // Non-fatal
        }
    }
    // In-memory: scan and delete matching keys
    const prefix = prefixedPattern.replace('*', '');
    for (const k of memCache.keys()) {
        if (k.startsWith(prefix)) {
            memCache.delete(k);
        }
    }
}
/**
 * Cleanup expired in-memory cache entries.
 * Called periodically to prevent memory leaks.
 */
function cleanupMemCache() {
    const now = Date.now();
    for (const [key, entry] of memCache.entries()) {
        if (now > entry.expiresAt) {
            memCache.delete(key);
        }
    }
}
// Cleanup every 5 minutes
setInterval(cleanupMemCache, 5 * 60 * 1000);
//# sourceMappingURL=redis.js.map