"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.updateProfile = exports.getMe = exports.register = exports.login = exports.adminLogin = exports.otpLogin = exports.getOrCreateUser = void 0;
const database_1 = require("../config/database");
const retry_1 = require("../utils/retry");
const retry_2 = require("../utils/retry");
const errorHandler_1 = require("../middleware/errorHandler");
const email_1 = require("../utils/email");
const jwt_1 = require("../utils/jwt");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// @desc    Get or create user from Supabase Auth
// @route   POST /api/auth/me
// @access  Private (Requires Supabase JWT)
const getOrCreateUser = async (req, res, next) => {
    try {
        if (!req.user) {
            throw new errorHandler_1.AppError('Not authenticated', 401);
        }
        console.log('[Auth] 🔐 Getting/creating user:', req.user.email);
        // Try to find existing user
        let user = await (0, retry_1.withRetry)(() => database_1.prisma.user.findUnique({
            where: { email: req.user.email },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
                isVerified: true,
                createdAt: true,
                updatedAt: true,
                supabaseId: true,
            }
        }));
        // If user doesn't exist, create one
        if (!user) {
            console.log('[Auth] 👤 Creating new user from Supabase auth:', req.user.email);
            user = await (0, retry_1.withRetry)(() => database_1.prisma.user.create({
                data: {
                    email: req.user.email,
                    supabaseId: req.user.id,
                    fullName: req.user.email.split('@')[0], // Placeholder
                    isVerified: true, // Supabase verified the identity
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    role: true,
                    isVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    supabaseId: true,
                },
            }));
            // Send welcome email
            try {
                await (0, email_1.sendEmail)({
                    to: user.email,
                    subject: 'Welcome to ORA Jewellery',
                    html: (0, email_1.getWelcomeEmailTemplate)(user.fullName),
                });
            }
            catch (emailError) {
                console.error('[Auth] Email error:', emailError);
            }
        }
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.isVerified,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrCreateUser = getOrCreateUser;
// @desc    Login user (DEPRECATED - Use Supabase OTP instead)
// @desc    OTP Login - Create/get user and return JWT
// @route   POST /api/auth/otp-login
// @access  Public (Requires valid supabaseId from Supabase Auth)
// 
// CRITICAL: This endpoint MUST:
// 1. Receive supabaseId from Supabase OTP flow (not auto-generated)
// 2. Link it to backend user record
// 3. Handle DB connection failures gracefully
// 4. Return structured error responses
const otpLogin = async (req, res, next) => {
    try {
        const { supabaseId, email, fullName } = req.body;
        console.log('[Auth] 📥 OTP Login:', { supabaseId, email });
        // ============================================
        // VALIDATION: Reject invalid requests
        // ============================================
        if (!supabaseId || !email) {
            console.error('[Auth] ❌ Invalid OTP payload:', { supabaseId, email });
            return res.status(400).json({
                success: false,
                error: 'supabaseId and email are required',
                retryable: false,
            });
        }
        // supabaseId must be a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(supabaseId)) {
            console.error('[Auth] ❌ Invalid supabaseId format:', { supabaseId });
            return res.status(400).json({
                success: false,
                error: 'Invalid supabaseId format',
                retryable: false,
            });
        }
        try {
            // ============================================
            // STEP 1: Try to find user by supabaseId
            // ============================================
            let user = await (0, retry_1.withRetry)(() => database_1.prisma.user.findUnique({
                where: { supabaseId },
            }));
            if (user) {
                console.log('[Auth] 🔄 Found by supabaseId, updating:', { id: user.id });
                // Update existing user
                user = await (0, retry_1.withRetry)(() => database_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        email,
                        fullName: fullName || user.fullName,
                        isVerified: true,
                    },
                }));
            }
            else {
                // ============================================
                // STEP 2: Try to find user by email
                // ============================================
                user = await (0, retry_1.withRetry)(() => database_1.prisma.user.findUnique({
                    where: { email },
                }));
                if (user) {
                    console.log('[Auth] 🔄 Found by email, updating:', { id: user.id });
                    // Link supabaseId to existing user
                    user = await (0, retry_1.withRetry)(() => database_1.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            supabaseId,
                            fullName: fullName || user.fullName,
                            isVerified: true,
                        },
                    }));
                }
                else {
                    // ============================================
                    // STEP 3: Create new user with supabaseId
                    // ============================================
                    console.log('[Auth] ✨ Creating new OTP user:', { email });
                    user = await (0, retry_1.withRetry)(() => database_1.prisma.user.create({
                        data: {
                            supabaseId,
                            email,
                            fullName: fullName || 'User',
                            isVerified: true,
                            role: 'CUSTOMER',
                        },
                    }));
                }
            }
            // ============================================
            // Generate JWT token for backend
            // ============================================
            const token = (0, jwt_1.generateToken)({
                id: user.id,
                email: user.email,
                role: user.role,
            });
            console.log('[Auth] ✅ OTP login success:', { id: user.id });
            return res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                    },
                    token,
                },
            });
        }
        catch (dbError) {
            // ============================================
            // Handle database errors with classification
            // ============================================
            const classified = (0, retry_2.classifyDatabaseError)(dbError);
            console.error('[Auth] 💥 Database error in OTP login:', {
                message: dbError instanceof Error ? dbError.message : String(dbError),
                code: dbError.code,
                retryable: classified.retryable,
            });
            return res.status(classified.statusCode).json({
                success: false,
                error: classified.message,
                retryable: classified.retryable,
                code: classified.code,
            });
        }
    }
    catch (error) {
        console.error('[Auth] ❌ OTP login failed:', error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.otpLogin = otpLogin;
// @desc    Admin Login - Email + password (SEPARATE FROM OTP)
// @route   POST /api/auth/admin-login
// @access  Public
//
// CRITICAL: This is a SEPARATE flow from OTP login!
// - OTP login: Uses Supabase-generated supabaseId
// - Admin login: Uses password + email (no OTP)
// - Never confuse the two or admin login will fail
const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('[Auth] 📥 Admin login attempt:', { email });
        // ============================================
        // VALIDATION
        // ============================================
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'email and password required',
                retryable: false,
            });
        }
        try {
            // ============================================
            // Find admin user
            // ============================================
            const admin = await (0, retry_1.withRetry)(() => database_1.prisma.user.findUnique({
                where: { email },
            }));
            if (!admin) {
                console.log('[Auth] ❌ Admin not found:', { email });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    retryable: false,
                });
            }
            // ============================================
            // Check admin role
            // ============================================
            if (admin.role !== 'ADMIN' && admin.role !== 'STAFF') {
                console.log('[Auth] ❌ User is not admin:', { email, role: admin.role });
                return res.status(403).json({
                    success: false,
                    error: 'You do not have admin access',
                    retryable: false,
                });
            }
            // ============================================
            // Verify password
            // ============================================
            const passwordField = admin.password;
            if (!passwordField) {
                console.log('[Auth] ❌ Admin has no password set:', { email });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    retryable: false,
                });
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, passwordField);
            if (!isPasswordValid) {
                console.log('[Auth] ❌ Invalid password:', { email });
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    retryable: false,
                });
            }
            // ============================================
            // Generate JWT token
            // ============================================
            const token = (0, jwt_1.generateToken)({
                id: admin.id,
                email: admin.email,
                role: admin.role,
            });
            console.log('[Auth] ✅ Admin login success:', { id: admin.id, email });
            return res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: admin.id,
                        email: admin.email,
                        fullName: admin.fullName,
                        role: admin.role,
                    },
                    token,
                },
            });
        }
        catch (dbError) {
            // ============================================
            // Handle database errors
            // ============================================
            const classified = (0, retry_2.classifyDatabaseError)(dbError);
            console.error('[Auth] 💥 Database error in admin login:', {
                message: dbError instanceof Error ? dbError.message : String(dbError),
                retryable: classified.retryable,
            });
            return res.status(classified.statusCode).json({
                success: false,
                error: classified.message,
                retryable: classified.retryable,
            });
        }
    }
    catch (error) {
        console.error('[Auth] ❌ Admin login failed:', error instanceof Error ? error.message : String(error));
        next(error);
    }
};
exports.adminLogin = adminLogin;
// @desc    Legacy login (kept for backward compatibility)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    const { supabaseId, email, password } = req.body;
    // If it's OTP login (has supabaseId)
    if (supabaseId) {
        return (0, exports.otpLogin)(req, res, next);
    }
    // If it's admin login (has password)
    if (password) {
        return (0, exports.adminLogin)(req, res, next);
    }
    // Invalid payload
    return res.status(400).json({
        success: false,
        error: 'Invalid payload',
    });
};
exports.login = login;
// @desc    Register new user (DEPRECATED - Use Supabase OTP instead)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    res.status(410).json({
        success: false,
        error: 'Password-based registration is deprecated. Use Supabase OTP authentication instead.',
    });
};
exports.register = register;
// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await (0, retry_1.withRetry)(() => database_1.prisma.user.findUnique({
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
        }));
        if (!user) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const { fullName, phone } = req.body;
        const user = await (0, retry_1.withRetry)(() => database_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(fullName && { fullName }),
                ...(phone && { phone }),
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                role: true,
            },
        }));
        res.json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    res.status(410).json({
        success: false,
        error: 'Password-based authentication is deprecated. Use Supabase OTP login instead.',
    });
};
exports.forgotPassword = forgotPassword;
// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    res.status(410).json({
        success: false,
        error: 'Password-based authentication is deprecated. Use Supabase OTP login instead.',
    });
};
exports.resetPassword = resetPassword;
// @desc    Change password (for logged-in users)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    res.status(410).json({
        success: false,
        error: 'Password-based authentication is deprecated. Use Supabase OTP login instead.',
    });
};
exports.changePassword = changePassword;
// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new errorHandler_1.AppError('User ID not found', 401);
        }
        // Delete all user data in order
        // 1. Delete all orders and related data
        const orders = await database_1.prisma.order.findMany({
            where: { userId },
            select: { id: true },
        });
        for (const order of orders) {
            // Delete inventory locks
            await database_1.prisma.inventoryLock.deleteMany({
                where: { orderId: order.id },
            });
            // Delete order items
            await database_1.prisma.orderItem.deleteMany({
                where: { orderId: order.id },
            });
            // Delete payments
            await database_1.prisma.payment.deleteMany({
                where: { orderId: order.id },
            });
            // Delete returns
            await database_1.prisma.return.deleteMany({
                where: { orderId: order.id },
            });
            // Delete order
            await database_1.prisma.order.delete({
                where: { id: order.id },
            });
        }
        // 2. Delete cart items
        await database_1.prisma.cartItem.deleteMany({
            where: { userId },
        });
        // 3. Delete addresses
        await database_1.prisma.address.deleteMany({
            where: { userId },
        });
        // 4. Delete reviews
        await database_1.prisma.review.deleteMany({
            where: { userId },
        });
        // 6. Delete user
        await database_1.prisma.user.delete({
            where: { id: userId },
        });
        res.json({
            success: true,
            message: 'Account deleted successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=auth.controller.backup.js.map