/**
 * Frontend Sentry Integration (Next.js)
 *
 * Captures:
 * - Checkout form errors
 * - Payment page failures
 * - API call failures
 * - React error boundaries
 *
 * Security:
 * - No tokens logged
 * - No email addresses logged
 * - No card data logged
 *
 * Usage: Wrap your app with the Sentry provider from sentry.client.config.ts
 */

import * as Sentry from '@sentry/nextjs';
import { Replay } from '@sentry/nextjs';

/**
 * Initialize Sentry for Next.js (should be called in layout.tsx or _app.tsx)
 */
export function initFrontendSentry(): void {
  // Check if already initialized
  if (Sentry.getCurrentHub().getClient()) {
    console.log('[Sentry] Frontend already initialized');
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    console.warn('[Sentry] NEXT_PUBLIC_SENTRY_DSN not set — error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',

    // 10% sample rate in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture all unhandled exceptions
    integrations: [
      new Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Replay 10% of all sessions + 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      // SECURITY: strip all sensitive data
      if (event.request) {
        // Remove cookies from breadcrumbs
        if (event.request.cookies) {
          event.request.cookies = {};
        }
        // Remove auth headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
      }

      // Never send email addresses or personal data
      if (event.user?.email) {
        delete event.user.email;
      }

      // Filter out noisy errors (network issues, ad blockers, etc.)
      if (event.message?.includes('ad blocker')) return null;
      if (event.message?.includes('ResizeObserver')) return null;

      return event;
    },
  });

  console.log('[Sentry] Frontend error monitoring initialized');
}

/**
 * Capture an API error that occurred during checkout
 */
export function captureCheckoutError(error: Error, context: string): void {
  Sentry.captureException(error, {
    tags: {
      phase: 'checkout',
      context,
    },
    level: 'error',
  });
}

/**
 * Capture a payment page error
 */
export function capturePaymentError(error: Error, orderId?: string): void {
  Sentry.captureException(error, {
    tags: {
      phase: 'payment',
    },
    contexts: {
      orderId: { id: orderId },
    },
    level: 'error',
  });
}

/**
 * Set checkout context (user ID only, no PII)
 */
export function setCheckoutContext(userId: string, orderId: string): void {
  Sentry.setUser({ id: userId });
  Sentry.setContext('checkout', {
    orderId,
  });
}

/**
 * Clear checkout context on completion
 */
export function clearCheckoutContext(): void {
  Sentry.setUser(null);
  Sentry.setContext('checkout', {});
}

/**
 * Global error handler for API failures
 */
export function captureApiError(error: unknown, endpoint: string, method: string): void {
  if (error instanceof Error) {
    Sentry.captureException(error, {
      tags: {
        api_endpoint: endpoint,
        api_method: method,
      },
    });
  }
}
