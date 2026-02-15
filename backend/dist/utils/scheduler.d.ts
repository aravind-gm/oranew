/**
 * Scheduled Jobs — Campaign auto-expiry + inventory lock cleanup + abandoned cart emails
 *
 * Runs on a simple setInterval basis (no external cron dependency).
 * Safe for single-instance deployments (Render free tier).
 */
/**
 * Start all scheduled jobs. Call once at server boot.
 */
export declare function startScheduler(): void;
//# sourceMappingURL=scheduler.d.ts.map