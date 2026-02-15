import { Router } from 'express';
import { validateCoupon } from '../controllers/coupon.controller';
import { protect } from '../middleware/auth';
import { couponLimiter } from '../middleware/rateLimiter';

const router = Router();

// ⚠️ SECURITY: No public coupon routes allowed
// Coupons must NEVER be enumerable or publicly accessible
// Prevents coupon farming/brute-forcing attacks

// Protected routes (require authentication)
router.post('/validate', protect, couponLimiter, validateCoupon);

export default router;
