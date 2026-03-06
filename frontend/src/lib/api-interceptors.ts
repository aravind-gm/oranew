/**
 * Axios Interceptors for Production-Ready Error Handling
 *
 * 503 handler: retry up to 3× with 2 s delay (server recovery)
 * 401 handler: attempt one silent token refresh, then retry original request.
 *              If refresh fails, redirect to login.
 *
 * Cookie strategy:
 *   - withCredentials=true means cookies are sent automatically
 *   - The refresh endpoint sets new access_token + refresh_token HttpOnly cookies
 *   - No token is ever stored in localStorage / memory
 */

import { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// ─────────────────────────────────────────────────────────────
// 503 retry state
// ─────────────────────────────────────────────────────────────
const retryMap = new Map<string, number>();
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// ─────────────────────────────────────────────────────────────
// 401 refresh state
// ─────────────────────────────────────────────────────────────
// Single flag prevents concurrent refresh attempts from spawning multiple
// /auth/refresh calls. All 401s that arrive while a refresh is in-flight
// queue behind the same promise.
let _refreshPromise: Promise<boolean> | null = null;

// Extend AxiosRequestConfig to carry a _retry flag
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Call POST /auth/refresh. Cookies are sent automatically.
 * Returns true if the backend set new access + refresh cookies.
 * Returns false if refresh token is expired / invalid.
 */
async function attemptTokenRefresh(api: AxiosInstance): Promise<boolean> {
  // Coalesce concurrent refresh attempts
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = api
    .post('/auth/refresh')
    .then(() => true)
    .catch(() => false)
    .finally(() => { _refreshPromise = null; });

  return _refreshPromise;
}

/**
 * Setup 503 retry + 401 silent-refresh interceptors.
 */
export function setupErrorInterceptor(api: AxiosInstance) {
  api.interceptors.response.use(
    (response) => {
      const key = `${response.config.method}:${response.config.url}`;
      retryMap.delete(key);
      return response;
    },
    async (error: AxiosError) => {
      const { response, config } = error;
      const reqConfig = config as RetryableRequestConfig | undefined;

      // ── 503: Server recovery (retry with backoff) ──────────────────
      if (response?.status === 503 && reqConfig) {
        const endpointKey = `${reqConfig.method}:${reqConfig.url}`;
        const retryCount = retryMap.get(endpointKey) || 0;

        if (retryCount < MAX_RETRIES) {
          retryMap.set(endpointKey, retryCount + 1);
          console.warn(
            `[API] 503 — retrying ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY}ms`,
            { endpoint: reqConfig.url }
          );
          await new Promise((r) => setTimeout(r, RETRY_DELAY));
          return api.request(reqConfig);
        }

        console.error('[API] Backend unavailable after max retries', {
          endpoint: reqConfig.url,
        });
        return Promise.reject(error);
      }

      // ── 401: Silent token refresh ─────────────────────────
      // Only attempt refresh once per request (prevent infinite loop).
      // Skip refresh for the refresh endpoint itself to avoid loops.
      if (
        response?.status === 401 &&
        reqConfig &&
        !reqConfig._retry &&
        !reqConfig.url?.includes('/auth/refresh') &&
        !reqConfig.url?.includes('/auth/login')
      ) {
        reqConfig._retry = true;

        const refreshed = await attemptTokenRefresh(api);

        if (refreshed) {
          // New access_token cookie is now set by the backend.
          // Re-issue the original request — withCredentials sends the new cookie.
          return api.request(reqConfig);
        }

        // Refresh failed — session is fully expired.
        // Redirect to login only in the browser.
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          // Don't redirect if already on an auth page
          if (!currentPath.startsWith('/auth/')) {
            window.location.href = `/auth/login?from=${encodeURIComponent(currentPath)}`;
          }
        }
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Setup request interceptor to ensure credentials are always sent.
 */
export function setupRequestInterceptor(api: AxiosInstance) {
  api.interceptors.request.use(
    (config) => {
      config.withCredentials = true;
      return config;
    },
    (error) => Promise.reject(error)
  );
}

