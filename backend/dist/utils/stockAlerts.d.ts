/**
 * Low Stock Alert Utility
 *
 * Sends a one-time Slack alert when stock falls to or below lowStockThreshold.
 * Uses the Product.lowStockAlertSentAt field to prevent duplicate notifications.
 * Resets automatically when stock is restocked above the threshold.
 *
 * Safety:
 * - Idempotent: alert fires only once per threshold crossing
 * - Reset: lowStockAlertSentAt is cleared when stock rises above threshold
 * - Non-blocking: fire-and-forget, never throws to caller
 */
/**
 * Check stock after a decrement and fire a Slack alert if threshold crossed.
 * Call this after any inventory decrement (order confirmation, stock update).
 *
 * @param productId - Prisma product ID
 * @param productName - For human-readable alert message
 * @param newStock - Updated stock quantity
 * @param threshold - lowStockThreshold from product record
 * @param alertSentAt - current lowStockAlertSentAt value
 */
export declare function checkAndAlertLowStock(productId: string, productName: string, newStock: number, threshold: number, alertSentAt: Date | null): Promise<void>;
//# sourceMappingURL=stockAlerts.d.ts.map