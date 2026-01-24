"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', category_controller_1.getCategories);
router.get('/:slug', category_controller_1.getCategoryBySlug);
router.post('/', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), category_controller_1.createCategory);
router.put('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), category_controller_1.updateCategory);
router.delete('/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN'), category_controller_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map