import { Router } from 'express';
import { otpLogin, verifyOtp, register, passwordLogin, changePassword, getMe, deleteAccount, login } from '../controllers/auth.controller';
import { refreshAccessToken, logout } from '../controllers/authToken.controller';
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

// Token management (HttpOnly cookies)
router.post('/refresh', authLimiter, refreshAccessToken);
router.post('/logout', protect, logout);

// Protected routes (requires JWT token)
router.get('/me', protect, getMe);
router.delete('/account', protect, deleteAccount);

export default router;

