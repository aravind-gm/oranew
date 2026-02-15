/**
 * Admin Audit Logger — Tracks all admin panel actions
 *
 * Usage:
 *   import { logAdminAction } from '../utils/auditLog';
 *   await logAdminAction(req, 'UPDATE', 'PRODUCT', productId, { field: 'price', oldValue, newValue });
 */
import { AuthRequest } from '../middleware/auth';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE' | 'BULK_ACTION' | 'CONFIG_CHANGE' | 'LOGIN' | 'TOGGLE';
export type AuditEntityType = 'PRODUCT' | 'ORDER' | 'CAMPAIGN' | 'SHIPPING' | 'TAX' | 'CONTENT' | 'USER' | 'CATEGORY' | 'COUPON' | 'SETTINGS';
/**
 * Log an admin action for audit trail.
 * Non-blocking — errors are swallowed to prevent disrupting the main flow.
 */
export declare function logAdminAction(req: AuthRequest, action: AuditAction, entityType: AuditEntityType, entityId?: string | null, details?: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=auditLog.d.ts.map