import { Router } from 'express';
import { 
  createAddress, 
  deleteAddress, 
  getAddresses, 
  updateAddress,
  completeProfile,
  getProfile,
  updateProfile 
} from '../controllers/user.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/complete-profile', completeProfile);

// Address routes
router.get('/addresses', getAddresses);
router.post('/addresses', createAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
