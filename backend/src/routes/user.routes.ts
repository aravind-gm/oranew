import { Router } from 'express';
import { createAddress, deleteAddress, getAddresses, updateAddress } from '../controllers/user.controller';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/addresses', getAddresses);
router.post('/addresses', createAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);

export default router;
