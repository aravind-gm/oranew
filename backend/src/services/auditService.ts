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
import { logAdminAction, AuditAction, AuditEntityType } from '../utils/auditLog';
import { captureException } from '../config/sentry';

// Sensitive field patterns that should never appear in audit logs
const SENSITIVE_PATTERNS = ['password', 'token', 'secret', 'key', 'otp', 'signature', 'hmac'];

/**
 * Recursively redact sensitive fields from an object
 */
function redactSensitiveFields(obj: unknown, depth = 0): unknown {
  if (depth > 10) return obj; // Prevent infinite recursion
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'object' && !Buffer.isBuffer(obj)) {
    if (Array.isArray(obj)) {
      return obj.map(item => redactSensitiveFields(item, depth + 1));
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => lowerKey.includes(pattern));

      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        result[key] = redactSensitiveFields(value, depth + 1);
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate very long strings (likely JSON blobs)
        result[key] = value.substring(0, 100) + '...';
      } else {
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
export const auditService = {
  /**
   * Log a product mutation (CREATE, UPDATE, DELETE)
   */
  async logProductAction(
    req: AuthRequest,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    productId: string,
    details?: {
      before?: Record<string, any>;
      after?: Record<string, any>;
      reason?: string;
    }
  ): Promise<void> {
    try {
      const redactedDetails = {
        reason: details?.reason,
        before: details?.before ? redactSensitiveFields(details.before) : undefined,
        after: details?.after ? redactSensitiveFields(details.after) : undefined,
      };

      await logAdminAction(req, action, 'PRODUCT', productId, redactedDetails);
    } catch (error) {
      console.error('[AuditService] Failed to log product action:', error);
      captureException(error, { context: 'product_audit' });
    }
  },

  /**
   * Log a category mutation
   */
  async logCategoryAction(
    req: AuthRequest,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    categoryId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const redactedDetails = redactSensitiveFields(details);
      await logAdminAction(req, action, 'CATEGORY', categoryId, redactedDetails);
    } catch (error) {
      console.error('[AuditService] Failed to log category action:', error);
      captureException(error, { context: 'category_audit' });
    }
  },

  /**
   * Log an order status change
   */
  async logOrderStatusChange(
    req: AuthRequest,
    orderId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string
  ): Promise<void> {
    try {
      await logAdminAction(req, 'UPDATE', 'ORDER', orderId, {
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
        reason: reason || 'Manual status change',
      });
    } catch (error) {
      console.error('[AuditService] Failed to log order status change:', error);
      captureException(error, { context: 'order_audit' });
    }
  },

  /**
   * Log a refund initiation
   */
  async logRefundInitiation(
    req: AuthRequest,
    orderId: string,
    paymentId: string,
    amount: number,
    reason?: string
  ): Promise<void> {
    try {
      await logAdminAction(req, 'CREATE', 'ORDER', orderId, {
        action: 'REFUND_INITIATED',
        paymentId,
        amount,
        reason: reason || 'Manual refund',
      });
    } catch (error) {
      console.error('[AuditService] Failed to log refund initiation:', error);
      captureException(error, { context: 'refund_audit' });
    }
  },

  /**
   * Log a user role change (critical security event)
   */
  async logUserRoleChange(
    req: AuthRequest,
    targetUserId: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    try {
      await logAdminAction(req, 'UPDATE', 'USER', targetUserId, {
        field: 'role',
        oldValue: oldRole,
        newValue: newRole,
      });

      // Also capture to Sentry for high-visibility
      captureException(
        new Error(`User role changed: ${oldRole} → ${newRole}`),
        {
          userId: targetUserId,
          changedBy: req.user?.id,
        }
      );
    } catch (error) {
      console.error('[AuditService] Failed to log role change:', error);
      captureException(error, { context: 'role_audit' });
    }
  },

  /**
   * Log coupon/discount mutations
   */
  async logCouponAction(
    req: AuthRequest,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    couponId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const redactedDetails = redactSensitiveFields(details);
      await logAdminAction(req, action, 'COUPON', couponId, redactedDetails);
    } catch (error) {
      console.error('[AuditService] Failed to log coupon action:', error);
      captureException(error, { context: 'coupon_audit' });
    }
  },

  /**
   * Log any generic admin action
   */
  async logGenericAction(
    req: AuthRequest,
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const redactedDetails = redactSensitiveFields(details);
      await logAdminAction(req, action, entityType, entityId, redactedDetails);
    } catch (error) {
      console.error('[AuditService] Failed to log generic action:', error);
      captureException(error, { context: 'generic_audit' });
    }
  },
};

export default auditService;
