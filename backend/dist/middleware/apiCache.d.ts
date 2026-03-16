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
/**
 * API response cache middleware.
 * @param ttlSeconds - Cache duration in seconds (default: 60)
 * @param keyPrefix - Optional prefix for the cache key (default: uses URL)
 */
export declare function apiCache(ttlSeconds?: number, keyPrefix?: string): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
/**
 * Middleware to invalidate product caches after admin mutations.
 * Attach after product create/update/delete handlers.
 */
export declare function invalidateProductCache(): (_req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to add Cache-Control headers without caching in Redis.
 * Lets browsers and CDNs cache the response without backend storage.
 */
export declare function browserCache(maxAge?: number): (_req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=apiCache.d.ts.map