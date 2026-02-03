"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Password-based authentication (replaces OTP)
router.post('/register', rateLimiter_1.authLimiter, auth_controller_1.register);
router.post('/login', rateLimiter_1.authLimiter, auth_controller_1.login);
router.post('/admin-login', rateLimiter_1.authLimiter, auth_controller_1.adminLogin);
router.post('/forgot-password', rateLimiter_1.authLimiter, auth_controller_1.forgotPassword);
router.post('/reset-password', rateLimiter_1.authLimiter, auth_controller_1.resetPassword);
// Protected routes (requires JWT token)
router.get('/me', auth_1.protect, auth_controller_1.getMe);
router.put('/profile', auth_1.protect, auth_controller_1.updateProfile);
router.put('/change-password', auth_1.protect, auth_controller_1.changePassword);
router.delete('/account', auth_1.protect, auth_controller_1.deleteAccount);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map