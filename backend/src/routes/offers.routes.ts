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

import { Router } from 'express';
import {
  getActiveCampaign,
  getOfferProducts,
  getAdminCampaign,
  updateAdminCampaign,
  getAdminOfferProducts,
  updateProductOfferSettings,
  validateOfferAtCheckout,
} from '../controllers/offers.controller';
import { authorize, protect } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/campaign', getActiveCampaign);
router.get('/products', getOfferProducts);
router.post('/validate', validateOfferAtCheckout);

// Admin routes
router.get('/admin/campaign', protect, authorize('ADMIN', 'STAFF'), getAdminCampaign);
router.put('/admin/campaign', protect, authorize('ADMIN', 'STAFF'), updateAdminCampaign);
router.get('/admin/products', protect, authorize('ADMIN', 'STAFF'), getAdminOfferProducts);
router.put('/admin/products/:id', protect, authorize('ADMIN', 'STAFF'), updateProductOfferSettings);

export default router;
