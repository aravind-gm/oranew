"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generate short-lived access token (30 minutes)
 * Used for API authentication
 */
const generateToken = (payload) => {
    // SECURITY: No fallback - must be explicitly set
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    // SECURITY: Default to 30m if not set (was 24h before hardening)
    const expiresIn = process.env.JWT_EXPIRES_IN || '30m';
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
    });
};
exports.generateToken = generateToken;
/**
 * Verify JWT token
 * Returns decoded payload if valid, null if invalid/expired
 */
const verifyToken = (token) => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET not configured');
        }
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=jwt.js.map