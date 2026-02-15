"use strict";
/**
 * Offers Routes — Campaign management + public offer endpoints
 *
 * Public:
 *   GET  /api/offers/campaign        — Get active campaign info
 *   GET  /api/offers/products        — Get all on-offer products
 *
 * Admin:
 *   GET  /api/offers/admin/campaign  — Get campaign settings
 *   PUT  /api/offers/admin/campaign  — Update campaign settings
 *   GET  /api/offers/admin/products  — List products with offer status
 *   PUT  /api/offers/admin/products/:id — Update offer settings on a product
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const offers_controller_1 = require("../controllers/offers.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/campaign', offers_controller_1.getActiveCampaign);
router.get('/products', offers_controller_1.getOfferProducts);
router.post('/validate', offers_controller_1.validateOfferAtCheckout);
// Admin routes
router.get('/admin/campaign', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), offers_controller_1.getAdminCampaign);
router.put('/admin/campaign', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), offers_controller_1.updateAdminCampaign);
router.get('/admin/products', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), offers_controller_1.getAdminOfferProducts);
router.put('/admin/products/:id', auth_1.protect, (0, auth_1.authorize)('ADMIN', 'STAFF'), offers_controller_1.updateProductOfferSettings);
exports.default = router;
//# sourceMappingURL=offers.routes.js.map