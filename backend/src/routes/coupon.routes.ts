import { Router } from 'express';
import { getCoupon, listCoupons, redeemCoupon, validateCoupon } from '../controllers/coupon.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/:code', getCoupon);
router.get('/', listCoupons);

// Protected routes (require authentication)
router.post('/:code/validate', protect, validateCoupon);
router.post('/:code/redeem', protect, redeemCoupon);

export default router;
