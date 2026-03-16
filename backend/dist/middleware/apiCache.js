"use strict";
/**
 * API Response Cache Middleware — Phase 4
 * ========================================
 *
 * Caches GET responses in Redis (with in-memory fallback).
 * Dramatically reduces DB load for frequently-accessed endpoints.
 *
 * Usage:
 *   router.get('/products', apiCache(60), getProducts);
 *
 * Cache invalidation:
 *   - Automatic TTL expiry
 *   - Manual: POST/PUT/DELETE on same resource invalidates cache
 *   - Admin product update → invalidates products:* cache
 *
 * Does NOT cache:
 *   - Authenticated requests (different users see different data)
 *   - POST/PUT/DELETE requests
 *   - Responses with status >= 400
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiCache = apiCache;
exports.invalidateProductCache = invalidateProductCache;
exports.browserCache = browserCache;
const redis_1 = require("../config/redis");
/**
 * API response cache middleware.
 * @param ttlSeconds - Cache duration in seconds (default: 60)
 * @param keyPrefix - Optional prefix for the cache key (default: uses URL)
 */
function apiCache(ttlSeconds = 60, keyPrefix) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET')
            return next();
        // Don't cache authenticated requests (user-specific data)
        if (req.cookies?.access_token || req.headers.authorization)
            return next();
        // Build cache key from URL + query params
        const cacheKey = `${keyPrefix || 'api'}:${req.originalUrl}`;
        try {
            const cached = await (0, redis_1.cacheGet)(cacheKey);
            if (cached) {
                // Set cache headers
                res.set('X-Cache', 'HIT');
                res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
                return res.status(cached.status).json(cached.body);
            }
        }
        catch {
            // Cache miss or error — proceed to handler
        }
        // Intercept the response to cache it
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Only cache successful responses
            if (res.statusCode < 400) {
                (0, redis_1.cacheSet)(cacheKey, { body, status: res.statusCode }, ttlSeconds).catch(() => { });
            }
            // Set cache headers
            res.set('X-Cache', 'MISS');
            res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
            return originalJson(body);
        };
        next();
    };
}
/**
 * Middleware to invalidate product caches after admin mutations.
 * Attach after product create/update/delete handlers.
 */
function invalidateProductCache() {
    return async (_req, _res, next) => {
        try {
            await (0, redis_1.cacheDelPattern)('api:/api/products*');
            await (0, redis_1.cacheDelPattern)('api:/api/categories*');
        }
        catch {
            // Non-fatal
        }
        next();
    };
}
/**
 * Middleware to add Cache-Control headers without caching in Redis.
 * Lets browsers and CDNs cache the response without backend storage.
 */
function browserCache(maxAge = 60) {
    return (_req, res, next) => {
        res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
        next();
    };
}
//# sourceMappingURL=apiCache.js.map