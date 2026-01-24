import { Router } from 'express';
import { addToCart, clearCart, getCart, removeFromCart, updateCartItem } from '../controllers/cart.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

export default router;
