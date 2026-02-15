"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// ⚠️ SECURITY: No public coupon routes allowed
// Coupons must NEVER be enumerable or publicly accessible
// Prevents coupon farming/brute-forcing attacks
// Protected routes (require authentication)
router.post('/validate', auth_1.protect, rateLimiter_1.couponLimiter, coupon_controller_1.validateCoupon);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map