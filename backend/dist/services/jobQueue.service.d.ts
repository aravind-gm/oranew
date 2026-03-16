/**
 * Background Job Queue — Phase 4
 * ================================
 *
 * Uses BullMQ + Redis for reliable, non-blocking background tasks:
 *  - Abandoned cart emails (replaces setInterval)
 *  - Slack/alert notifications
 *  - Payment reconciliation
 *  - Future: marketing emails, report generation
 *
 * Graceful degradation:
 *  - If Redis is not available, falls back to the existing
 *    setInterval-based scheduler (no behavior change)
 *  - Jobs are persistent — survive server restarts
 *  - Failed jobs are retried with exponential backoff
 *
 * Architecture:
 *  - Queue: defines job types and options
 *  - Worker: processes jobs in the background
 *  - All workers run in the same process (Render single-instance)
 */
export type JobType = 'abandoned-cart-email' | 'payment-reconciliation' | 'slack-alert' | 'cache-invalidation' | 'order-confirmation-email' | 'post-purchase-day2' | 'post-purchase-day7' | 'post-purchase-day21' | 'payment-parity-check';
export interface AbandonedCartJobData {
    type: 'abandoned-cart-email';
}
export interface ReconciliationJobData {
    type: 'payment-reconciliation';
}
export interface SlackAlertJobData {
    type: 'slack-alert';
    message: string;
    level: 'info' | 'error' | 'warning';
}
export interface CacheInvalidationJobData {
    type: 'cache-invalidation';
    pattern: string;
}
export interface OrderEmailJobData {
    type: 'order-confirmation-email';
    orderId: string;
    customerEmail: string;
}
export interface PostPurchaseJobData {
    type: 'post-purchase-day2' | 'post-purchase-day7' | 'post-purchase-day21';
    orderId: string;
    customerEmail: string;
}
export interface PaymentParityJobData {
    type: 'payment-parity-check';
}
export type JobData = AbandonedCartJobData | ReconciliationJobData | SlackAlertJobData | CacheInvalidationJobData | OrderEmailJobData | PostPurchaseJobData | PaymentParityJobData;
/**
 * Initialize the BullMQ queue and worker.
 * Call once at server startup, after Redis is initialized.
 * Returns false if Redis is not available (graceful fallback).
 */
export declare function initJobQueue(): Promise<boolean>;
/**
 * Add a job to the background queue.
 * If the queue is not available, the job is processed inline (fallback).
 */
export declare function enqueueJob(name: string, data: JobData): Promise<void>;
/**
 * Graceful shutdown — close queue and worker.
 */
export declare function shutdownJobQueue(): Promise<void>;
//# sourceMappingURL=jobQueue.service.d.ts.map