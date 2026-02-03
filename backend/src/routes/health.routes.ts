import { Router } from 'express';
import { health, healthDetailed } from '../controllers/health.controller';
import { protect } from '../middleware/auth';

const router = Router();

// Public health check (simple)
// Used by Render to know when service is ready
router.get('/', health);

// Detailed health check (requires auth)
// Used for admin diagnostics
router.get('/detailed', protect, healthDetailed);

export default router;
