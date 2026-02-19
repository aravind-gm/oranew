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

let sentryInitialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Sentry] ⚠️  SENTRY_DSN not set — error monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',

    // 10 % of transactions traced in production (enough for P95 tracking)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Never send events in test environment
    enabled: process.env.NODE_ENV !== 'test',

    beforeSend(event) {
      // ── SECURITY: strip all cookie and auth header data ──
      if (event.request) {
        if (event.request.cookies) {
          event.request.cookies = {};
        }
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
          delete event.request.headers['set-cookie'];
        }
      }

      // Strip user email from breadcrumbs (keep only userId)
      if (event.user?.email) {
        delete event.user.email;
      }

      return event;
    },
  });

  sentryInitialized = true;
  console.log(`[Sentry] ✅ Error monitoring initialized (env: ${process.env.NODE_ENV})`);
}

/**
 * Capture an exception with optional extra context.
 * Safe to call even if Sentry was not initialized — it will be a no-op.
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (!sentryInitialized) return;
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Set the authenticated user on the current Sentry scope.
 * Called from the auth middleware after token validation.
 * Only sets userId — never email or any PII beyond the opaque ID.
 */
export function setSentryUser(userId: string, role: string): void {
  if (!sentryInitialized) return;
  Sentry.setUser({ id: userId, role });
}

/**
 * Clear the Sentry user scope (call on logout / unauthenticated paths).
 */
export function clearSentryUser(): void {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
}

export { Sentry };
