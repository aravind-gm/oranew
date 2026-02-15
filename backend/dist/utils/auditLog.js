"use strict";
/**
 * Admin Audit Logger — Tracks all admin panel actions
 *
 * Usage:
 *   import { logAdminAction } from '../utils/auditLog';
 *   await logAdminAction(req, 'UPDATE', 'PRODUCT', productId, { field: 'price', oldValue, newValue });
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminAction = logAdminAction;
const database_1 = require("../config/database");
/**
 * Log an admin action for audit trail.
 * Non-blocking — errors are swallowed to prevent disrupting the main flow.
 */
async function logAdminAction(req, action, entityType, entityId, details) {
    try {
        const userId = req.user?.id;
        if (!userId)
            return; // Can't log without a user
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket?.remoteAddress ||
            null;
        await database_1.prisma.adminAuditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId: entityId || null,
                details: details || null,
                ipAddress,
            },
        });
    }
    catch (error) {
        // Audit logging should never break the main operation
        console.error('[AuditLog] Failed to log action:', error instanceof Error ? error.message : error);
    }
}
//# sourceMappingURL=auditLog.js.map