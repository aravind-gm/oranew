import { Router } from 'express';
import { cancelOrder, checkout, getOrderById, getOrders, processRefund, requestReturn } from '../controllers/order.controller';
import { authorize, protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.post('/checkout', checkout);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.post('/:id/return', requestReturn);

// Admin only
router.post('/return/process-refund', authorize('ADMIN', 'STAFF'), processRefund);

export default router;
