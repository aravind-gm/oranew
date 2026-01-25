"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/products/:productId', review_controller_1.getProductReviews);
router.post('/', auth_1.protect, review_controller_1.createReview);
router.put('/:id', auth_1.protect, review_controller_1.updateReview);
router.delete('/:id', auth_1.protect, review_controller_1.deleteReview);
exports.default = router;
//# sourceMappingURL=review.routes.js.map