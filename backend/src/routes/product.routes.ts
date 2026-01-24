import { Router } from 'express';
import {
    createProduct,
    deleteProduct,
    getFeaturedProducts,
    getProductBySlug,
    getProducts,
    searchProducts,
    updateProduct,
} from '../controllers/product.controller';
import { authorize, protect } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/:slug', getProductBySlug);

// Admin routes
router.post('/', protect, authorize('ADMIN', 'STAFF'), createProduct);
router.put('/:id', protect, authorize('ADMIN', 'STAFF'), updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), deleteProduct);

export default router;
