"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const authToken_controller_1 = require("../controllers/authToken.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Unified login endpoint (hybrid OTP + password)
router.post('/login', rateLimiter_1.authLimiter, auth_controller_1.login);
// OTP / Magic Link authentication
router.post('/otp-login', rateLimiter_1.authLimiter, auth_controller_1.otpLogin);
router.post('/verify-otp', rateLimiter_1.authLimiter, auth_controller_1.verifyOtp);
// Password authentication
router.post('/register', rateLimiter_1.authLimiter, auth_controller_1.register);
router.post('/password-login', rateLimiter_1.authLimiter, auth_controller_1.passwordLogin);
router.post('/change-password', auth_1.protect, auth_controller_1.changePassword);
// Token management (HttpOnly cookies)
router.post('/refresh', rateLimiter_1.authLimiter, authToken_controller_1.refreshAccessToken);
router.post('/logout', auth_1.protect, authToken_controller_1.logout);
// Protected routes (requires JWT token)
router.get('/me', auth_1.protect, auth_controller_1.getMe);
router.delete('/account', auth_1.protect, auth_controller_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map