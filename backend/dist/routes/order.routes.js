"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const guestCheckout_controller_1 = require("../controllers/guestCheckout.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Guest checkout — no auth required (optionalAuth attaches user if logged in)
router.post('/guest-checkout', rateLimiter_1.checkoutLimiter, auth_1.optionalAuth, guestCheckout_controller_1.guestCheckout);
// Public track order — no auth required
router.post('/track', order_controller_1.trackOrder);
// Authenticated routes
router.use(auth_1.protect);
router.post('/checkout', rateLimiter_1.checkoutLimiter, order_controller_1.checkout); // Rate limited: 3 per 5 minutes
router.get('/', order_controller_1.getOrders);
router.get('/:id', order_controller_1.getOrderById);
router.put('/:id/cancel', order_controller_1.cancelOrder);
router.post('/:id/return', order_controller_1.requestReturn);
// REMOVED: Fake refund endpoint that doesn't call Razorpay API
// Use /api/payments/refund instead which properly processes refunds through Razorpay
exports.default = router;
//# sourceMappingURL=order.routes.js.map