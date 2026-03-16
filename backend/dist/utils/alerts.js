"use strict";
/**
 * Slack / Webhook Alerting
 *
 * Sends fire-and-forget alerts on payment events.
 * Uses SLACK_WEBHOOK_URL env var. If not set → logs to console only.
 *
 * All calls are non-blocking (no await at call site needed).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentAlert = sendPaymentAlert;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const LEVEL_EMOJI = {
    critical: '🚨',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};
/**
 * Send a payment alert to Slack.
 * Fire-and-forget — never throws, never blocks.
 */
function sendPaymentAlert(payload) {
    _sendPaymentAlert(payload).catch((err) => {
        console.error('[Alert] Failed to send Slack alert:', err?.message ?? err);
    });
}
async function _sendPaymentAlert(payload) {
    const { level, event, orderId, userId, amount, reason, extra } = payload;
    const emoji = LEVEL_EMOJI[level] ?? '📌';
    const ts = new Date().toISOString();
    // Always log to console regardless of Slack config
    console.warn(`[PAYMENT ALERT] ${emoji} ${event}`, {
        orderId,
        userId,
        amount,
        reason,
        extra,
        ts,
    });
    if (!SLACK_WEBHOOK_URL)
        return; // Slack not configured → console-only
    const amountStr = amount !== undefined ? `₹${(amount / 100).toFixed(2)}` : undefined;
    const text = [
        `${emoji} *${event}*`,
        orderId && `• Order: \`${orderId}\``,
        userId && `• User: \`${userId}\``,
        amountStr && `• Amount: ${amountStr}`,
        reason && `• Reason: ${reason}`,
        `• Time: ${ts}`,
    ]
        .filter(Boolean)
        .join('\n');
    const body = JSON.stringify({ text });
    await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        // 5 s timeout — alerts must never block the main request
        signal: AbortSignal.timeout(5000),
    });
}
//# sourceMappingURL=alerts.js.map