"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.post('/checkout', order_controller_1.checkout);
router.get('/', order_controller_1.getOrders);
router.get('/:id', order_controller_1.getOrderById);
router.put('/:id/cancel', order_controller_1.cancelOrder);
router.post('/:id/return', order_controller_1.requestReturn);
// Admin only
router.post('/return/process-refund', (0, auth_1.authorize)('ADMIN', 'STAFF'), order_controller_1.processRefund);
exports.default = router;
//# sourceMappingURL=order.routes.js.map