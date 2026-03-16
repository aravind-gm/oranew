"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_1 = require("../middleware/auth");
const apiCache_1 = require("../middleware/apiCache");
const redis_1 = require("../config/redis");
const router = (0, express_1.Router)();
// Public routes — cached for CDN + browser
router.get('/', (0, apiCache_1.apiCache)(120), product_controller_1.getProducts); // 2 min cache
router.get('/featured', (0, apiCache_1.apiCache)(120), product_controller_1.getFeaturedProducts); // 2 min cache
router.get('/search', (0, apiCache_1.apiCache)(30), product_controller_1.searchProducts); // 30s cache
router.get('/recommended', (0, apiCache_1.apiCache)(120), product_controller_1.getRecommendedProducts); // 2 min cache
router.get('/id/:id', (0, apiCache_1.apiCache)(120), product_controller_1.getProductByIdPublic); // 2 min cache
router.get('/:slug', (0, apiCache_1.apiCache)(120), product_controller_1.getProductBySlug); // 2 min cache
// Admin routes (invalidate cache after mutations)
// Cache invalidation middleware — hooks into response finish event
const invalidateProducts = (_req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode < 400) {
            (0, redis_1.cacheDelPattern)('api:/api/products*').catch(() => { });
        }
    });
    next();
};
router.post('/', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), invalidateProducts, product_controller_1.createProduct);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), invalidateProducts, product_controller_1.updateProduct);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), invalidateProducts, product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map