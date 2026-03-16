"use strict";
/**
 * Audit Logging Wrapper Service
 *
 * Centralizes all admin action logging with automatic redaction of sensitive fields.
 * Wraps the auditLog utility with strict field validation and PII masking.
 *
 * Usage:
 *   await auditService.logAction(req, 'UPDATE', 'PRODUCT', productId, {
 *     before: { price: 100 },
 *     after: { price: 150 }
 *   });
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const auditLog_1 = require("../utils/auditLog");
const sentry_1 = require("../config/sentry");
// Sensitive field patterns that should never appear in audit logs
const SENSITIVE_PATTERNS = ['password', 'token', 'secret', 'key', 'otp', 'signature', 'hmac'];
/**
 * Recursively redact sensitive fields from an object
 */
function redactSensitiveFields(obj, depth = 0) {
    if (depth > 10)
        return obj; // Prevent infinite recursion
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'object' && !Buffer.isBuffer(obj)) {
        if (Array.isArray(obj)) {
            return obj.map(item => redactSensitiveFields(item, depth + 1));
        }
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = SENSITIVE_PATTERNS.some(pattern => lowerKey.includes(pattern));
            if (isSensitive) {
                result[key] = '[REDACTED]';
            }
            else if (typeof value === 'object') {
                result[key] = redactSensitiveFields(value, depth + 1);
            }
            else if (typeof value === 'string' && value.length > 100) {
                // Truncate very long strings (likely JSON blobs)
                result[key] = value.substring(0, 100) + '...';
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    // For primitives and buffers, return as-is
    return obj;
}
/**
 * Admin action logger with automatic PII masking
 */
exports.auditService = {
    /**
     * Log a product mutation (CREATE, UPDATE, DELETE)
     */
    async logProductAction(req, action, productId, details) {
        try {
            const redactedDetails = {
                reason: details?.reason,
                before: details?.before ? redactSensitiveFields(details.before) : undefined,
                after: details?.after ? redactSensitiveFields(details.after) : undefined,
            };
            await (0, auditLog_1.logAdminAction)(req, action, 'PRODUCT', productId, redactedDetails);
        }
        catch (error) {
            console.error('[AuditService] Failed to log product action:', error);
            (0, sentry_1.captureException)(error, { context: 'product_audit' });
        }
    },
    /**
     * Log a category mutation
     */
    async logCategoryAction(req, action, categoryId, details) {
        try {
            const redactedDetails = redactSensitiveFields(details);
            await (0, auditLog_1.logAdminAction)(req, action, 'CATEGORY', categoryId, redactedDetails);
        }
        catch (error) {
            console.error('[AuditService] Failed to log category action:', error);
            (0, sentry_1.captureException)(error, { context: 'category_audit' });
        }
    },
    /**
     * Log an order status change
     */
    async logOrderStatusChange(req, orderId, oldStatus, newStatus, reason) {
        try {
            await (0, auditLog_1.logAdminAction)(req, 'UPDATE', 'ORDER', orderId, {
                field: 'status',
                oldValue: oldStatus,
                newValue: newStatus,
                reason: reason || 'Manual status change',
            });
        }
        catch (error) {
            console.error('[AuditService] Failed to log order status change:', error);
            (0, sentry_1.captureException)(error, { context: 'order_audit' });
        }
    },
    /**
     * Log a refund initiation
     */
    async logRefundInitiation(req, orderId, paymentId, amount, reason) {
        try {
            await (0, auditLog_1.logAdminAction)(req, 'CREATE', 'ORDER', orderId, {
                action: 'REFUND_INITIATED',
                paymentId,
                amount,
                reason: reason || 'Manual refund',
            });
        }
        catch (error) {
            console.error('[AuditService] Failed to log refund initiation:', error);
            (0, sentry_1.captureException)(error, { context: 'refund_audit' });
        }
    },
    /**
     * Log a user role change (critical security event)
     */
    async logUserRoleChange(req, targetUserId, oldRole, newRole) {
        try {
            await (0, auditLog_1.logAdminAction)(req, 'UPDATE', 'USER', targetUserId, {
                field: 'role',
                oldValue: oldRole,
                newValue: newRole,
            });
            // Also capture to Sentry for high-visibility
            (0, sentry_1.captureException)(new Error(`User role changed: ${oldRole} → ${newRole}`), {
                userId: targetUserId,
                changedBy: req.user?.id,
            });
        }
        catch (error) {
            console.error('[AuditService] Failed to log role change:', error);
            (0, sentry_1.captureException)(error, { context: 'role_audit' });
        }
    },
    /**
     * Log coupon/discount mutations
     */
    async logCouponAction(req, action, couponId, details) {
        try {
            const redactedDetails = redactSensitiveFields(details);
            await (0, auditLog_1.logAdminAction)(req, action, 'COUPON', couponId, redactedDetails);
        }
        catch (error) {
            console.error('[AuditService] Failed to log coupon action:', error);
            (0, sentry_1.captureException)(error, { context: 'coupon_audit' });
        }
    },
    /**
     * Log any generic admin action
     */
    async logGenericAction(req, action, entityType, entityId, details) {
        try {
            const redactedDetails = redactSensitiveFields(details);
            await (0, auditLog_1.logAdminAction)(req, action, entityType, entityId, redactedDetails);
        }
        catch (error) {
            console.error('[AuditService] Failed to log generic action:', error);
            (0, sentry_1.captureException)(error, { context: 'generic_audit' });
        }
    },
};
exports.default = exports.auditService;
//# sourceMappingURL=auditService.js.map