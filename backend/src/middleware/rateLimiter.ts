import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedis } from '../config/redis';

// Build Redis store if Redis is available, otherwise undefined (falls back to MemoryStore in dev only)
function getRedisStore() {
  const client = getRedis();
  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[RateLimiter] ⚠️  Redis not available — rate limiting may not work correctly in cluster mode');
    }
    return undefined;
  }
  return new RedisStore({
    // @ts-expect-error - ioredis call method is compatible
    sendCommand: (...args: string[]) => client.call(...args),
    prefix: 'rl:',
  });
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window (more reasonable for OTP attempts)
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
});

// Checkout rate limiter (prevents spam checkout abuse)
export const checkoutLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 checkout attempts per 5 minutes
  message: {
    success: false,
    error: 'Too many checkout attempts. Please wait 5 minutes before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return (req as any).user?.id || req.ip || 'unknown';
  },
});

// Payment rate limiter (prevents payment spam)
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 payment attempts per 10 minutes
  message: {
    success: false,
    error: 'Too many payment attempts. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
});

// Coupon validation limiter (prevents brute-force coupon guessing)
export const couponLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 coupon attempts per minute
  message: {
    success: false,
    error: 'Too many coupon validation attempts. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
});

// COD checkout rate limiter (stricter — prevents COD abuse / fraud)
export const codLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2, // 2 COD attempts per 10 minutes
  message: {
    success: false,
    error: 'Too many Cash on Delivery attempts. Please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip || 'unknown';
  },
});

// Analytics dashboard rate limiter (prevents excessive DB load)
export const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute (dashboard refreshes)
  message: {
    success: false,
    error: 'Too many analytics requests. Please wait before refreshing.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore(),
});
