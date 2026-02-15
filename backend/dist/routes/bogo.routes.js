"use strict";
/**
 * BOGO Public Routes — Customer-facing BOGO endpoints
 *
 * GET  /api/products/bogo-eligible     — List BOGO-eligible products
 * POST /api/checkout/validate-bogo     — Validate BOGO pair at checkout
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bogo_controller_1 = require("../controllers/bogo.controller");
const router = (0, express_1.Router)();
// Public: Get BOGO-eligible products (no auth required)
router.get('/', bogo_controller_1.getBogoEligibleProducts);
// Public: Validate BOGO pair at checkout (no auth required — order will require auth)
router.post('/validate', bogo_controller_1.validateBOGOCheckout);
exports.default = router;
//# sourceMappingURL=bogo.routes.js.map