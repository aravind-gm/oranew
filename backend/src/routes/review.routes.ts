import { Router } from 'express';
import { createReview, deleteReview, getProductReviews, updateReview } from '../controllers/review.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/products/:productId', getProductReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
