"use strict";
/**
 * Supabase JWT Authentication Middleware
 * Validates tokens issued by Supabase Auth
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectSupabase = void 0;
const supabase_1 = require("../config/supabase");
const errorHandler_1 = require("./errorHandler");
const protectSupabase = async (req, res, next) => {
    try {
        let token;
        // Extract token from Authorization header
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            throw new errorHandler_1.AppError('Not authorized, no token provided', 401);
        }
        try {
            // Verify with Supabase
            const supabase = (0, supabase_1.getSupabaseAdmin)();
            const { data, error } = await supabase.auth.getUser(token);
            if (error || !data.user) {
                console.error('[Supabase Auth] ❌ Token validation failed:', error?.message);
                throw new errorHandler_1.AppError('Invalid token', 401);
            }
            // Attach Supabase user to request
            req.supabaseUser = {
                id: data.user.id,
                email: data.user.email,
                phone: data.user.phone,
            };
            next();
        }
        catch (error) {
            if (error instanceof errorHandler_1.AppError) {
                throw error;
            }
            console.error('[Supabase Auth] 🔴 Unexpected error:', error);
            throw new errorHandler_1.AppError('Authentication failed', 401);
        }
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            return res.status(error.statusCode).json({
                success: false,
                error: error.message,
            });
        }
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
        });
    }
};
exports.protectSupabase = protectSupabase;
//# sourceMappingURL=supabaseAuth.js.map