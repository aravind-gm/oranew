/**
 * Sentry — Production Error Monitoring
 *
 * Captures:
 *  - Uncaught exceptions
 *  - Unhandled promise rejections
 *  - HTTP request context (URL, method, user ID)
 *
 * Security guarantees:
 *  - Cookies stripped from all events
 *  - Authorization headers stripped
 *  - Token values never appear in Sentry
 *
 * Usage: call initSentry() once at the very top of server.ts, BEFORE any
 * other imports that might throw.
 */
import * as Sentry from '@sentry/node';
export declare function initSentry(): void;
/**
 * Capture an exception with optional extra context.
 * Safe to call even if Sentry was not initialized — it will be a no-op.
 */
export declare function captureException(error: unknown, context?: Record<string, unknown>): void;
/**
 * Set the authenticated user on the current Sentry scope.
 * Called from the auth middleware after token validation.
 * Only sets userId — never email or any PII beyond the opaque ID.
 */
export declare function setSentryUser(userId: string, role: string): void;
/**
 * Clear the Sentry user scope (call on logout / unauthenticated paths).
 */
export declare function clearSentryUser(): void;
export { Sentry };
//# sourceMappingURL=sentry.d.ts.map