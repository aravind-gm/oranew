/**
 * Duplicate Order Guard Middleware
 *
 * Prevents duplicate order creation within 10 seconds using a server-side guard.
 * Uses in-memory SHA-256 cart hash to only block exact same cart resubmissions.
 *
 * Strategy: Check if a checkout was attempted with identical:
 * - userId + cartHash + timestamp (within 10s)
 *
 * This prevents accidental double-clicks and browser back-button issues
 * without blocking legitimate different orders by the same user.
 */

import { NextFunction, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from './auth';

// In-memory dedupe store (for current process)
// Key: `${userId}:${cartHash}`, Value: timestamp
const recentOrders = new Map<string, number>();
const DEDUPE_WINDOW = 10 * 1000; // 10 seconds — catch double-clicks/network retries
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup old entries every 5 minutes

// Periodic cleanup of stale entries
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, timestamp] of recentOrders) {
    if (now - timestamp > DEDUPE_WINDOW * 2) {
      recentOrders.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0 && process.env.NODE_ENV === 'development') {
    console.log(`[DuplicateOrderGuard] Cleaned up ${cleaned} stale entries`);
  }
}, CLEANUP_INTERVAL);

/**
 * Compute hash of cart items for idempotency detection
 */
function computeCartHash(items: any[]): string {
  const normalized = items
    .map(item => `${item.productId}:${item.quantity}`)
    .sort()
    .join('|');

  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Middleware: Detect duplicate order attempts
 *
 * Called BEFORE checkout endpoint processes the request.
 * Stores a dedup key in req for the checkout to finalize after order is created.
 */
export const duplicateOrderGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only protect POST to checkout endpoints
    if (req.method !== 'POST' || !req.path.includes('/checkout')) {
      return next();
    }

    const userId = req.user?.id;
    if (!userId) {
      return next(); // Unauthenticated users are not protected
    }

    // Get items from request body
    const items = req.body?.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return next(); // Empty cart — not a concern
    }

    // Compute cart hash
    const cartHash = computeCartHash(items);
    const dedupKey = `${userId}:${cartHash}`;
    const now = Date.now();

    // Check in-memory store first (fastest)
    const lastAttempt = recentOrders.get(dedupKey);
    if (lastAttempt && now - lastAttempt < DEDUPE_WINDOW) {
      console.warn('[DuplicateOrderGuard] Duplicate attempt detected', {
        userId,
        cartHash: cartHash.substring(0, 16) + '...',
        secondsSinceLastAttempt: Math.round((now - lastAttempt) / 1000),
      });

      return res.status(409).json({
        success: false,
        error: 'Duplicate order detected. Please wait a few seconds before retrying.',
        retryAfter: Math.ceil((DEDUPE_WINDOW - (now - lastAttempt)) / 1000),
      });
    }

    // Store this attempt
    recentOrders.set(dedupKey, now);
    (req as any).dedupKey = dedupKey; // Attach for later cleanup if needed

    if (process.env.NODE_ENV === 'development') {
      console.log('[DuplicateOrderGuard] Order attempt recorded', {
        userId: userId.substring(0, 8) + '...',
        itemsCount: items.length,
      });
    }

    next();
  } catch (error) {
    console.error('[DuplicateOrderGuard] Error:', error);
    // Fail open — don't block checkout on guard failure
    next();
  }
};

/**
 * Optional: Extract dedup key and perform post-order cleanup
 * Call this after order is successfully created.
 */
export function cleanupDedupKey(dedupKey?: string): void {
  if (dedupKey) {
    // Could optionally extend the window to prevent retries
    // recentOrders.set(dedupKey, Date.now() + DEDUPE_WINDOW);
  }
}
