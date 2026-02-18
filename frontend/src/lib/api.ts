/**
 * ORA Jewellery — Backend API Client
 * 
 * Features:
 * - Communicates with Render backend via cookie-based auth
 * - Automatic retry on 503 (backend cold start)
 * - HttpOnly cookies for secure authentication
 * - Graceful error handling
 */

import axios, { AxiosError } from 'axios';
import { setupErrorInterceptor, setupRequestInterceptor } from './api-interceptors';

// Determine API URL with fallback
const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined' && window.location.hostname === 'orashop.in') {
    return 'https://oranew.onrender.com/api';
  }
  
  return 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000, // 30s timeout for checkout operations
  withCredentials: true, // Enable cookies for all requests
});

// Setup custom interceptors for 503 retry and auth
setupRequestInterceptor(api);
setupErrorInterceptor(api);

// Fix Content-Type for JSON requests (multipart requests will set their own)
api.interceptors.request.use((config) => {
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// 401 handler - just propagate the error.
// Individual pages and the middleware handle unauthenticated state.
// DO NOT use window.location here — it causes a full page reload on every
// unauthenticated /auth/me check, which is the source of the auto-refresh loop.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Let the calling code handle 401 — no global redirect
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default api;
