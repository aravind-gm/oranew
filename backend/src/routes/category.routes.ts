import { Router } from 'express';
import { createCategory, deleteCategory, getCategories, getCategoryBySlug, updateCategory } from '../controllers/category.controller';
import { authorize, protect } from '../middleware/auth';
import { apiCache } from '../middleware/apiCache';
import { cacheDelPattern } from '../config/redis';

const router = Router();

// Public routes — categories change rarely, cache aggressively
router.get('/', apiCache(300), getCategories);         // 5 min cache
router.get('/:slug', apiCache(300), getCategoryBySlug); // 5 min cache

// Admin routes (invalidate cache after mutations)
// Cache invalidation middleware — hooks into response finish event
const invalidateCategories = (_req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      cacheDelPattern('api:/api/categories*').catch(() => {});
    }
  });
  next();
};

router.post('/', protect, authorize('ADMIN', 'STAFF'), invalidateCategories, createCategory);
router.put('/:id', protect, authorize('ADMIN', 'STAFF'), invalidateCategories, updateCategory);
router.delete('/:id', protect, authorize('ADMIN'), invalidateCategories, deleteCategory);

export default router;
