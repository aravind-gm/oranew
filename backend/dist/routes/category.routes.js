"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_1 = require("../middleware/auth");
const apiCache_1 = require("../middleware/apiCache");
const redis_1 = require("../config/redis");
const router = (0, express_1.Router)();
// Public routes — categories change rarely, cache aggressively
router.get('/', (0, apiCache_1.apiCache)(300), category_controller_1.getCategories); // 5 min cache
router.get('/:slug', (0, apiCache_1.apiCache)(300), category_controller_1.getCategoryBySlug); // 5 min cache
// Admin routes (invalidate cache after mutations)
// Cache invalidation middleware — hooks into response finish event
const invalidateCategories = (_req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode < 400) {
            (0, redis_1.cacheDelPattern)('api:/api/categories*').catch(() => { });
        }
    });
    next();
};
router.post('/', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), invalidateCategories, category_controller_1.createCategory);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), invalidateCategories, category_controller_1.updateCategory);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), invalidateCategories, category_controller_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map