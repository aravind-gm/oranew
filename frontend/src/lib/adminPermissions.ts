/**
 * Admin Permissions — Frontend Role-Based Access Control
 * =======================================================
 * 
 * Defines what each role can access in the admin panel.
 * This is a UI-level gate. Backend still enforces authorize('ADMIN', 'STAFF').
 * 
 * Roles: ADMIN (full access), STAFF (limited access)
 * 
 * Usage:
 *   import { hasPermission, usePermission } from '@/lib/adminPermissions';
 *   
 *   if (hasPermission(userRole, 'products.delete')) { ... }
 *   const canDelete = usePermission('products.delete');
 */

export type AdminPermission =
  // Products
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'products.archive'
  | 'products.bulk_action'
  // Orders
  | 'orders.view'
  | 'orders.update_status'
  | 'orders.cancel'
  // Customers
  | 'customers.view'
  // Marketing
  | 'marketing.view'
  | 'marketing.edit_campaigns'
  | 'marketing.toggle_campaigns'
  // Content
  | 'content.view'
  | 'content.edit'
  | 'content.delete'
  // Settings
  | 'settings.view'
  | 'settings.shipping'
  | 'settings.taxes'
  | 'settings.users'
  | 'settings.audit_log'
  // Analytics
  | 'analytics.view';

/**
 * Role → Permission mapping.
 * ADMIN gets everything. STAFF gets a subset.
 */
const ROLE_PERMISSIONS: Record<string, AdminPermission[]> = {
  ADMIN: [
    'products.view', 'products.create', 'products.edit', 'products.delete', 'products.archive', 'products.bulk_action',
    'orders.view', 'orders.update_status', 'orders.cancel',
    'customers.view',
    'marketing.view', 'marketing.edit_campaigns', 'marketing.toggle_campaigns',
    'content.view', 'content.edit', 'content.delete',
    'settings.view', 'settings.shipping', 'settings.taxes', 'settings.users', 'settings.audit_log',
    'analytics.view',
  ],
  STAFF: [
    'products.view', 'products.edit',
    'orders.view', 'orders.update_status',
    'customers.view',
    'marketing.view',
    'content.view',
    'analytics.view',
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string | undefined, permission: AdminPermission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the given permissions.
 */
export function hasAnyPermission(role: string | undefined, permissions: AdminPermission[]): boolean {
  return permissions.some(p => hasPermission(role, p));
}

/**
 * Check if a role has ALL of the given permissions.
 */
export function hasAllPermissions(role: string | undefined, permissions: AdminPermission[]): boolean {
  return permissions.every(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: string): AdminPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}
