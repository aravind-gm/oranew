/**
 * Vercel Serverless Backend API Client
 * Updated for serverless architecture with production-grade error handling
 * 
 * Features:
 * - Automatic 503 retry with exponential backoff
 * - Graceful handling of database connection failures
 * - JWT token management via authStore
 * - Request/response interceptors for cross-cutting concerns
 */

import { useAuthStore } from '@/store/authStore';
import axios, { AxiosError } from 'axios';

const api = axios.create({
  // Point to Vercel serverless backend
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for serverless functions
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
// Add JWT token from localStorage/authStore
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const authStore = useAuthStore.getState();
      const storeToken = authStore.token;
      const localToken = localStorage.getItem('ora_token');
      const token = localToken || storeToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // CRITICAL: Do NOT set Content-Type for FormData
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR - WITH 503 AUTO-RETRY
// ============================================
// Handle errors gracefully:
// - 503: Retry after delay (database temporarily unavailable)
// - 401: Clear auth and redirect to login
// - Other: Pass through to caller
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config;
    const originalRequest = config as any;

    // ============================================
    // 503 Service Unavailable - RETRY LOGIC
    // ============================================
    // Backend database is temporarily down
    // Retry silently after exponential backoff
    if (
      error.response?.status === 503 &&
      originalRequest._retryCount < 3
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Exponential backoff: 2s, 4s, 8s
      const delayMs = 2000 * Math.pow(2, originalRequest._retryCount - 1);

      console.warn(
        `[API 503] Service unavailable. Retry ${originalRequest._retryCount}/3 after ${delayMs}ms`,
        error.response?.data?.message || 'Database temporarily unavailable'
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Retry the request
      return api.request(config);
    }

    // ============================================
    // 401 UNAUTHORIZED
    // ============================================
    // Session expired or token invalid
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      localStorage.removeItem('ora_token');
      authStore.logout();
      
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login?error=unauthorized';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
