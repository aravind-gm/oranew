"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/:code', coupon_controller_1.getCoupon);
router.get('/', coupon_controller_1.listCoupons);
// Protected routes (require authentication)
router.post('/:code/validate', auth_1.protect, coupon_controller_1.validateCoupon);
router.post('/:code/redeem', auth_1.protect, coupon_controller_1.redeemCoupon);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map