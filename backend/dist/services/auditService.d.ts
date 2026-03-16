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
import { AuthRequest } from '../middleware/auth';
import { AuditAction, AuditEntityType } from '../utils/auditLog';
/**
 * Admin action logger with automatic PII masking
 */
export declare const auditService: {
    /**
     * Log a product mutation (CREATE, UPDATE, DELETE)
     */
    logProductAction(req: AuthRequest, action: "CREATE" | "UPDATE" | "DELETE", productId: string, details?: {
        before?: Record<string, any>;
        after?: Record<string, any>;
        reason?: string;
    }): Promise<void>;
    /**
     * Log a category mutation
     */
    logCategoryAction(req: AuthRequest, action: "CREATE" | "UPDATE" | "DELETE", categoryId: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log an order status change
     */
    logOrderStatusChange(req: AuthRequest, orderId: string, oldStatus: string, newStatus: string, reason?: string): Promise<void>;
    /**
     * Log a refund initiation
     */
    logRefundInitiation(req: AuthRequest, orderId: string, paymentId: string, amount: number, reason?: string): Promise<void>;
    /**
     * Log a user role change (critical security event)
     */
    logUserRoleChange(req: AuthRequest, targetUserId: string, oldRole: string, newRole: string): Promise<void>;
    /**
     * Log coupon/discount mutations
     */
    logCouponAction(req: AuthRequest, action: "CREATE" | "UPDATE" | "DELETE", couponId: string, details?: Record<string, any>): Promise<void>;
    /**
     * Log any generic admin action
     */
    logGenericAction(req: AuthRequest, action: AuditAction, entityType: AuditEntityType, entityId: string, details?: Record<string, any>): Promise<void>;
};
export default auditService;
//# sourceMappingURL=auditService.d.ts.map