/**
 * Frontend Sentry wrapper
 *
 * Provides captureException / captureMessage helpers that gracefully degrade
 * to console.error if NEXT_PUBLIC_SENTRY_DSN is not set or the package is
 * not yet installed.
 *
 * Install when disk space is available:
 *   npm install @sentry/nextjs
 * Then uncomment the dynamic import below.
 *
 * SECURITY:
 *  - DSN must be a NEXT_PUBLIC_ var (safe — DSN is designed to be public)
 *  - No tokens, cookies, or auth headers are ever sent
 */

type SentryUser = { id: string; role?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _sentry: any = null;

async function getSentry(): Promise<any | null> {
  if (_sentry) return _sentry;
  try {
    // Dynamic import keeps it tree-shakeable and avoids build errors
    // when package is not yet installed. Cast through unknown because
    // @sentry/nextjs may not be in node_modules yet (disk-space constraint).
    _sentry = await import(
      /* webpackIgnore: true */ '@sentry/nextjs' as string
    );
    return _sentry;
  } catch {
    return null;
  }
}

// Initialize on module load (fire-and-forget)
getSentry().then((sdk) => {
  if (!sdk || !process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  sdk.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    enabled: process.env.NODE_ENV === 'production',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    beforeSend(event: any) {
      // Strip cookies and auth headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }
      if (event.user?.email) {
        delete event.user.email;
      }
      return event;
    },
  });
}).catch(() => {/* silent — Sentry is optional */});

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const sdk = await getSentry();
  if (!sdk) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry:stub] captureException:', error, context);
    }
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sdk.withScope((scope: any) => {
    if (context) scope.setExtras(context);
    sdk.captureException(error);
  });
}

export async function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): Promise<void> {
  const sdk = await getSentry();
  if (!sdk) return;
  sdk.captureMessage(message, level);
}

export function setSentryUser(user: SentryUser): void {
  getSentry().then((sdk) => {
    if (!sdk) return;
    sdk.setUser({ id: user.id, role: user.role });
  }).catch(() => {});
}

export function clearSentryUser(): void {
  getSentry().then((sdk) => {
    if (!sdk) return;
    sdk.setUser(null);
  }).catch(() => {});
}
