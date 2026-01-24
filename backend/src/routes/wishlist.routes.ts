import { Router } from 'express';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlist.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:id', removeFromWishlist);

export default router;
