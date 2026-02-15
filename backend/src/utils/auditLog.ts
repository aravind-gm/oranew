/**
 * Admin Audit Logger — Tracks all admin panel actions
 * 
 * Usage:
 *   import { logAdminAction } from '../utils/auditLog';
 *   await logAdminAction(req, 'UPDATE', 'PRODUCT', productId, { field: 'price', oldValue, newValue });
 */

import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'ARCHIVE' 
  | 'RESTORE' 
  | 'BULK_ACTION' 
  | 'CONFIG_CHANGE'
  | 'LOGIN'
  | 'TOGGLE';

export type AuditEntityType = 
  | 'PRODUCT' 
  | 'ORDER' 
  | 'CAMPAIGN' 
  | 'SHIPPING' 
  | 'TAX' 
  | 'CONTENT' 
  | 'USER'
  | 'CATEGORY'
  | 'COUPON'
  | 'SETTINGS';

/**
 * Log an admin action for audit trail.
 * Non-blocking — errors are swallowed to prevent disrupting the main flow.
 */
export async function logAdminAction(
  req: AuthRequest,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId?: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) return; // Can't log without a user

    const ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 
      req.socket?.remoteAddress || 
      null;

    await prisma.adminAuditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        details: details || null,
        ipAddress,
      },
    });
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('[AuditLog] Failed to log action:', error instanceof Error ? error.message : error);
  }
}
