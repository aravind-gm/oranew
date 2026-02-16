/**
 * Axios Interceptors for Production-Ready Error Handling
 * Handles 503 errors gracefully without logging out users
 * Cookie-based authentication - no manual token injection needed
 */

import { AxiosError, AxiosInstance } from 'axios';

// Track retry state per endpoint to avoid infinite loops
const retryMap = new Map<string, number>();
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Setup response interceptor to handle 503 (Service Unavailable)
 * when Render backend is starting up
 */
export function setupErrorInterceptor(api: AxiosInstance) {
  api.interceptors.response.use(
    // Success response
    (response) => {
      // Clear retry counter on success
      const key = `${response.config.method}:${response.config.url}`;
      retryMap.delete(key);
      return response;
    },
    // Error response
    async (error: AxiosError) => {
      const { response, config } = error;

      // Only handle 503 Service Unavailable (backend cold start)
      if (response?.status === 503) {
        const endpointKey = `${config?.method}:${config?.url}`;
        const retryCount = retryMap.get(endpointKey) || 0;

        // If we haven't exceeded retry limit
        if (retryCount < MAX_RETRIES) {
          retryMap.set(endpointKey, retryCount + 1);

          console.warn(
            `[API] 🟡 Service temporarily unavailable (503). Retrying ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY}ms...`,
            { endpoint: config?.url }
          );

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));

          // Retry the request
          if (config) {
            return api.request(config);
          }
        } else {
          // Max retries exceeded
          console.error('[API] ❌ Backend service unavailable after retries', {
            endpoint: config?.url,
            retries: MAX_RETRIES,
          });

          // CRITICAL: Do NOT clear auth store on 503
          // User should remain logged in and retry manually
          return Promise.reject(error);
        }
      }

      // For other errors, pass through
      return Promise.reject(error);
    }
  );
}

/**
 * Setup request interceptor to configure credentials
 */
export function setupRequestInterceptor(api: AxiosInstance) {
  api.interceptors.request.use(
    (config) => {
      // Enable credentials for cookie-based authentication
      config.withCredentials = true;
      return config;
    },
    (error) => Promise.reject(error)
  );
}
