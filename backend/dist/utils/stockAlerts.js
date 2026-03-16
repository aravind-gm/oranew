"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAndAlertLowStock = checkAndAlertLowStock;
const database_1 = require("../config/database");
const sentry_1 = require("../config/sentry");
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://orashop.in';
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
async function checkAndAlertLowStock(productId, productName, newStock, threshold, alertSentAt) {
    try {
        const isLow = newStock <= threshold;
        if (isLow && alertSentAt === null) {
            // First time crossing threshold — send alert and mark
            await database_1.prisma.product.update({
                where: { id: productId },
                data: { lowStockAlertSentAt: new Date() },
            });
            _sendLowStockAlert(productId, productName, newStock, threshold).catch((err) => {
                console.error('[StockAlert] Failed to send Slack alert:', err);
                (0, sentry_1.captureException)(err, { context: 'low_stock_slack_alert', productId });
            });
        }
        else if (!isLow && alertSentAt !== null) {
            // Stock has been restocked above threshold — reset the alert flag
            await database_1.prisma.product.update({
                where: { id: productId },
                data: { lowStockAlertSentAt: null },
            });
            console.log(`[StockAlert] ✅ Restocked: ${productName} (${newStock} units) — alert reset`);
        }
    }
    catch (err) {
        console.error('[StockAlert] Error in checkAndAlertLowStock:', err);
        (0, sentry_1.captureException)(err, { context: 'stock_alert_check', productId });
    }
}
async function _sendLowStockAlert(productId, productName, stock, threshold) {
    const adminUrl = `${FRONTEND_URL}/admin/products/${productId}`;
    const emoji = stock === 0 ? '🚫' : stock <= 2 ? '🔴' : '⚠️';
    const urgency = stock === 0 ? 'OUT OF STOCK' : stock <= 2 ? 'CRITICALLY LOW' : 'LOW STOCK';
    console.warn(`[StockAlert] ${emoji} ${urgency}: "${productName}" — ${stock} remaining (threshold: ${threshold})`);
    if (!SLACK_WEBHOOK_URL)
        return;
    const payload = {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `${emoji} ${urgency}: ORA Jewellery`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    { type: 'mrkdwn', text: `*Product:*\n${productName}` },
                    { type: 'mrkdwn', text: `*Stock Remaining:*\n*${stock}* units` },
                    { type: 'mrkdwn', text: `*Alert Threshold:*\n${threshold} units` },
                    { type: 'mrkdwn', text: `*Time:*\n${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST` },
                ],
            },
            {
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: { type: 'plain_text', text: '📦 Update Stock', emoji: true },
                        style: 'primary',
                        url: adminUrl,
                    },
                ],
            },
        ],
    };
    const res = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        throw new Error(`Slack webhook failed: ${res.status} ${res.statusText}`);
    }
}
//# sourceMappingURL=stockAlerts.js.map