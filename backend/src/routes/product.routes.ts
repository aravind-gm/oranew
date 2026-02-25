import { Router } from 'express';
import {
    createProduct,
    deleteProduct,
    getFeaturedProducts,
    getProductByIdPublic,
    getProductBySlug,
    getProducts,
    getRecommendedProducts,
    searchProducts,
    updateProduct,
} from '../controllers/product.controller';
import { authorize, protect } from '../middleware/auth';
import { apiCache } from '../middleware/apiCache';
import { cacheDelPattern } from '../config/redis';

const router = Router();

// Public routes — cached for CDN + browser
router.get('/', apiCache(120), getProducts);                       // 2 min cache
router.get('/featured', apiCache(120), getFeaturedProducts);       // 2 min cache
router.get('/search', apiCache(30), searchProducts);               // 30s cache
router.get('/recommended', apiCache(120), getRecommendedProducts); // 2 min cache
router.get('/id/:id', apiCache(120), getProductByIdPublic);        // 2 min cache
router.get('/:slug', apiCache(120), getProductBySlug);             // 2 min cache

// Admin routes (invalidate cache after mutations)
// Cache invalidation middleware — hooks into response finish event
const invalidateProducts = (_req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
  res.on('finish', () => {
    if (res.statusCode < 400) {
      cacheDelPattern('api:/api/products*').catch(() => {});
    }
  });
  next();
};

router.post('/', protect, authorize('ADMIN', 'STAFF'), invalidateProducts, createProduct);
router.put('/:id', protect, authorize('ADMIN', 'STAFF'), invalidateProducts, updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), invalidateProducts, deleteProduct);

export default router;
