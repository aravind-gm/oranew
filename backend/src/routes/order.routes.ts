import { Router } from 'express';
import { cancelOrder, checkout, getOrderById, getOrders, processRefund, requestReturn } from '../controllers/order.controller';
import { guestCheckout } from '../controllers/guestCheckout.controller';
import { authorize, optionalAuth, protect } from '../middleware/auth';
import { checkoutLimiter, codLimiter } from '../middleware/rateLimiter';

const router = Router();

// Guest checkout — no auth required (optionalAuth attaches user if logged in)
router.post('/guest-checkout', checkoutLimiter, optionalAuth, guestCheckout);

// Authenticated routes
router.use(protect);

router.post('/checkout', checkoutLimiter, checkout); // Rate limited: 3 per 5 minutes
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/return', requestReturn);

// REMOVED: Fake refund endpoint that doesn't call Razorpay API
// Use /api/payments/refund instead which properly processes refunds through Razorpay

export default router;
