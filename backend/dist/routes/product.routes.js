"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("../controllers/product.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', product_controller_1.getProducts);
router.get('/featured', product_controller_1.getFeaturedProducts);
router.get('/search', product_controller_1.searchProducts);
router.get('/:slug', product_controller_1.getProductBySlug);
// Admin routes
router.post('/', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), product_controller_1.createProduct);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), product_controller_1.updateProduct);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), product_controller_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=product.routes.js.map