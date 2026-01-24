import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, getCategoryBySlug, updateCategory } from '../controllers/category.controller';
import { authorize, protect } from '../middleware/auth';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

router.post('/', protect, authorize('ADMIN', 'STAFF'), createCategory);
router.put('/:id', protect, authorize('ADMIN', 'STAFF'), updateCategory);
router.delete('/:id', protect, authorize('ADMIN'), deleteCategory);

export default router;
