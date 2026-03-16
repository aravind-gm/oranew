/**
 * Slack / Webhook Alerting
 *
 * Sends fire-and-forget alerts on payment events.
 * Uses SLACK_WEBHOOK_URL env var. If not set → logs to console only.
 *
 * All calls are non-blocking (no await at call site needed).
 */
export type AlertLevel = 'critical' | 'error' | 'warning' | 'info';
interface PaymentAlertPayload {
    level: AlertLevel;
    event: string;
    orderId?: string;
    userId?: string;
    amount?: number;
    reason?: string;
    extra?: Record<string, unknown>;
}
/**
 * Send a payment alert to Slack.
 * Fire-and-forget — never throws, never blocks.
 */
export declare function sendPaymentAlert(payload: PaymentAlertPayload): void;
export {};
//# sourceMappingURL=alerts.d.ts.map