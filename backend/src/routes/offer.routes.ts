/**
 * Offer Routes — "Buy Any Necklace, Get a Ring FREE"
 *
 * Public:
 *   GET  /api/offer/necklaces      — List eligible necklaces
 *   GET  /api/offer/rings          — List eligible rings
 *   POST /api/offer/validate       — Validate cart offer (pre-checkout)
 *
 * Admin:
 *   GET  /api/admin/offer/campaign
 *   PUT  /api/admin/offer/campaign
 *   GET  /api/admin/offer/products
 *   PUT  /api/admin/offer/products/:id
 *   GET  /api/admin/offer/stats
 */

import { Router } from 'express';
import { authorize, protect } from '../middleware/auth';
import {
  getOfferCampaign,
  updateOfferCampaign,
  getOfferProducts,
  updateProductOffer,
  getOfferStats,
  listEligibleNecklaces,
  listEligibleRings,
  validateOfferCartEndpoint,
} from '../controllers/offer.controller';

const router = Router();

// ── Public ──────────────────────────────────────────────────────────────────
router.get('/necklaces', listEligibleNecklaces);
router.get('/rings', listEligibleRings);
router.post('/validate', validateOfferCartEndpoint);

// ── Admin ────────────────────────────────────────────────────────────────────
router.get('/admin/campaign', protect, authorize('ADMIN'), getOfferCampaign);
router.put('/admin/campaign', protect, authorize('ADMIN'), updateOfferCampaign);
router.get('/admin/products', protect, authorize('ADMIN'), getOfferProducts);
router.put('/admin/products/:id', protect, authorize('ADMIN'), updateProductOffer);
router.get('/admin/stats', protect, authorize('ADMIN'), getOfferStats);

export default router;
