import { Router } from 'express';
import { getShippingConfig } from '../controllers/shipping.controller';

const router = Router();

// Public — no auth required
router.get('/rules', getShippingConfig);

export default router;
