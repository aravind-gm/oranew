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

import { Request, Response, NextFunction } from 'express';
import { cacheGet, cacheSet, cacheDelPattern } from '../config/redis';

/**
 * API response cache middleware.
 * @param ttlSeconds - Cache duration in seconds (default: 60)
 * @param keyPrefix - Optional prefix for the cache key (default: uses URL)
 */
export function apiCache(ttlSeconds: number = 60, keyPrefix?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Don't cache authenticated requests (user-specific data)
    if (req.cookies?.access_token || req.headers.authorization) return next();

    // Build cache key from URL + query params
    const cacheKey = `${keyPrefix || 'api'}:${req.originalUrl}`;

    try {
      const cached = await cacheGet<{ body: unknown; status: number }>(cacheKey);

      if (cached) {
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`);
        return res.status(cached.status).json(cached.body);
      }
    } catch {
      // Cache miss or error — proceed to handler
    }

    // Intercept the response to cache it
    const originalJson = res.json.bind(res);
    res.json = function (body: unknown) {
      // Only cache successful responses
      if (res.statusCode < 400) {
        cacheSet(cacheKey, { body, status: res.statusCode }, ttlSeconds).catch(() => {});
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
export function invalidateProductCache() {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      await cacheDelPattern('api:/api/products*');
      await cacheDelPattern('api:/api/categories*');
    } catch {
      // Non-fatal
    }
    next();
  };
}

/**
 * Middleware to add Cache-Control headers without caching in Redis.
 * Lets browsers and CDNs cache the response without backend storage.
 */
export function browserCache(maxAge: number = 60) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`);
    next();
  };
}
