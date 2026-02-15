"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shipping_controller_1 = require("../controllers/shipping.controller");
const router = (0, express_1.Router)();
// Public — no auth required
router.get('/rules', shipping_controller_1.getShippingConfig);
exports.default = router;
//# sourceMappingURL=shipping.routes.js.map