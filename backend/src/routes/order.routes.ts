import { Router } from 'express';
import { cancelOrder, checkout, getOrderById, getOrders, processRefund, requestReturn } from '../controllers/order.controller';
import { authorize, protect } from '../middleware/auth';
import { checkoutLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

router.post('/checkout', checkoutLimiter, checkout); // Rate limited: 3 per 5 minutes
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/return', requestReturn);

// REMOVED: Fake refund endpoint that doesn't call Razorpay API
// Use /api/payments/refund instead which properly processes refunds through Razorpay

export default router;
