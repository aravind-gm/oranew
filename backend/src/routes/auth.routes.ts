import { Router } from 'express';
import { changePassword, deleteAccount, forgotPassword, getMe, login, register, resetPassword, updateProfile } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;
