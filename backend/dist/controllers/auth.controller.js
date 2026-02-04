"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.logout = exports.getMe = exports.verifyOtp = exports.otpLogin = void 0;
const database_1 = require("../config/database");
const email_1 = require("../utils/email");
const jwt_1 = require("../utils/jwt");
// ============================================
// CUSTOM 8-DIGIT OTP AUTHENTICATION SYSTEM
// ============================================
// Generate and verify 8-digit OTP codes
// Store OTP temporarily in Prisma with expiration
// Store OTPs in memory (for production, use Redis)
const otpStore = new Map();
// Generate 8-digit OTP
function generate8DigitOTP() {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
}
// @desc    Send 8-digit OTP to email
// @route   POST /api/auth/otp-login
// @access  Public
const otpLogin = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email is required',
            });
        }
        // Generate 8-digit OTP
        const otp = generate8DigitOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        // Store OTP with email as key
        otpStore.set(email.toLowerCase(), { otp, expiresAt });
        // Send OTP via email
        const emailSent = await (0, email_1.sendEmail)({
            to: email.toLowerCase(),
            subject: 'Your ORA Login Code',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; }
            .logo { font-size: 36px; font-weight: 300; color: #d97706; font-family: serif; }
            .tagline { color: #9ca3af; font-size: 14px; }
            .otp-box { background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 48px; font-weight: bold; letter-spacing: 8px; color: #78350f; font-family: monospace; }
            .message { color: #6b7280; font-size: 16px; margin: 20px 0; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ORA</div>
              <div class="tagline">own. radiate. adorn.</div>
            </div>
            
            <p class="message">Hello,</p>
            <p class="message">Here's your login code for ORA Jewellery:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p class="message">This code will expire in <strong>5 minutes</strong>.</p>
            <p class="message">If you didn't request this code, please ignore this email.</p>
            
            <div class="footer">
              <p>© 2026 ORA Jewellery. Crafted with elegance.</p>
            </div>
          </div>
        </body>
        </html>
      `,
        });
        // For development/testing: Always log OTP to console
        console.log('\n' + '='.repeat(60));
        console.log('🔐 OTP LOGIN REQUEST');
        console.log('='.repeat(60));
        console.log(`📧 Email: ${email}`);
        console.log(`🔢 OTP Code: ${otp}`);
        console.log(`⏰ Expires: ${expiresAt.toLocaleString()}`);
        console.log(`📬 Email Status: ${emailSent ? '✅ Sent' : '⚠️  Failed (check SMTP config)'}`);
        console.log('='.repeat(60) + '\n');
        // Allow login even if email fails (for testing)
        return res.status(200).json({
            success: true,
            message: emailSent
                ? 'OTP sent to your email. Please check your inbox.'
                : 'OTP generated. Check server console for code (email service unavailable).',
        });
    }
    catch (error) {
        console.error('[Auth] ❌ OTP login error:', error);
        next(error);
    }
};
exports.otpLogin = otpLogin;
// @desc    Verify 8-digit OTP and create session
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                error: 'Email and OTP are required',
            });
        }
        const emailLower = email.toLowerCase();
        // Check if OTP exists for this email
        const storedOtpData = otpStore.get(emailLower);
        if (!storedOtpData) {
            return res.status(400).json({
                success: false,
                error: 'OTP not found. Please request a new one.',
            });
        }
        // Check if OTP is expired
        if (new Date() > storedOtpData.expiresAt) {
            otpStore.delete(emailLower);
            return res.status(400).json({
                success: false,
                error: 'OTP has expired. Please request a new one.',
            });
        }
        // Verify OTP
        if (storedOtpData.otp !== otp) {
            return res.status(400).json({
                success: false,
                error: 'Invalid OTP. Please try again.',
            });
        }
        // OTP is valid - delete it
        otpStore.delete(emailLower);
        // Get or create user in Prisma
        let user = await database_1.prisma.user.findUnique({
            where: { email: emailLower },
        });
        if (!user) {
            // First time user - create account
            user = await database_1.prisma.user.create({
                data: {
                    email: emailLower,
                    fullName: email.split('@')[0],
                    role: 'CUSTOMER',
                    isVerified: true,
                },
            });
            console.log(`[Auth] ✅ New user created: ${email}`);
        }
        else {
            // Mark as verified on successful OTP
            if (!user.isVerified) {
                user = await database_1.prisma.user.update({
                    where: { email: emailLower },
                    data: { isVerified: true },
                });
            }
        }
        // Generate JWT token for backend session
        const token = (0, jwt_1.generateToken)({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        console.log(`[Auth] ✅ User logged in via OTP: ${email}`);
        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                isVerified: user.isVerified,
            },
            token,
        });
    }
    catch (error) {
        console.error('[Auth] ❌ OTP verification error:', error);
        next(error);
    }
};
exports.verifyOtp = verifyOtp;
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isVerified: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        return res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error('[Auth] ❌ Get user error:', error);
        next(error);
    }
};
exports.getMe = getMe;
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
    try {
        // Clear any backend sessions if needed
        console.log(`[Auth] ✅ User logged out: ${req.user.email}`);
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    }
    catch (error) {
        console.error('[Auth] ❌ Logout error:', error);
        next(error);
    }
};
exports.logout = logout;
// @desc    Delete account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        // Delete user from Prisma
        await database_1.prisma.user.delete({
            where: { id: userId },
        });
        console.log(`[Auth] ✅ Account deleted: ${req.user.email}`);
        return res.status(200).json({
            success: true,
            message: 'Account deleted successfully',
        });
    }
    catch (error) {
        console.error('[Auth] ❌ Delete account error:', error);
        next(error);
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=auth.controller.js.map