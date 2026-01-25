"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.get('/', cart_controller_1.getCart);
router.post('/', cart_controller_1.addToCart);
router.put('/:id', cart_controller_1.updateCartItem);
router.delete('/:id', cart_controller_1.removeFromCart);
router.delete('/', cart_controller_1.clearCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map