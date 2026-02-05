import { Router } from 'express';
import { otpLogin, verifyOtp, register, passwordLogin, changePassword, getMe, logout, deleteAccount, login } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

// Unified login endpoint (hybrid OTP + password)
router.post('/login', authLimiter, login);

// OTP / Magic Link authentication
router.post('/otp-login', authLimiter, otpLogin);
router.post('/verify-otp', authLimiter, verifyOtp);

// Password authentication
router.post('/register', authLimiter, register);
router.post('/password-login', authLimiter, passwordLogin);
router.post('/change-password', protect, changePassword);

// Protected routes (requires JWT token)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.delete('/account', protect, deleteAccount);

export default router;

