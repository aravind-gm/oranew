/**
 * BOGO Public Routes — Customer-facing BOGO endpoints
 *
 * GET  /api/products/bogo-eligible     — List BOGO-eligible products
 * POST /api/checkout/validate-bogo     — Validate BOGO pair at checkout
 */

import { Router } from 'express';
import {
  getBogoEligibleProducts,
  validateBOGOCheckout,
} from '../controllers/bogo.controller';

const router = Router();

// Public: Get BOGO-eligible products (no auth required)
router.get('/', getBogoEligibleProducts);

// Public: Validate BOGO pair at checkout (no auth required — order will require auth)
router.post('/validate', validateBOGOCheckout);

export default router;
