import { Router } from 'express';
import { otpLogin, verifyOtp, getMe, logout, deleteAccount } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// OTP / Magic Link authentication (Supabase-based)
router.post('/otp-login', authLimiter, otpLogin);
router.post('/verify-otp', authLimiter, verifyOtp);

// Protected routes (requires JWT token)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.delete('/account', protect, deleteAccount);

export default router;

