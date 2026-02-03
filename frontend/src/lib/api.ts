/**
 * Vercel Serverless Backend API Client
 * Updated for serverless architecture with Render cold-start handling
 * 
 * Features:
 * - Communicates with Render backend
 * - Automatic retry on 503 (backend cold start)
 * - JWT token injection
 * - Graceful error handling
 */

import { useAuthStore } from '@/store/authStore';
import axios, { AxiosError } from 'axios';
import { setupErrorInterceptor, setupRequestInterceptor } from './api-interceptors';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Setup custom interceptors for 503 retry and auth
setupRequestInterceptor(api);
setupErrorInterceptor(api);

// Additional response interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 🛑 CRITICAL: Never logout on backend API 401 errors
    // Backend 401 does NOT mean authentication is invalid
    // It means this specific endpoint doesn't accept our token format
    
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      console.log('[API] ⚠️ Backend API returned 401 (not an auth failure)');
      console.log('[API] Supabase session status:', { 
        hasToken: !!authStore.token, 
        hasUser: !!authStore.user,
        isHydrated: authStore.isHydrated 
      });
      
      // ✅ DO NOT logout
      console.log('[API] ✅ Keeping user logged in');
    }
    
    return Promise.reject(error);
  }
);

export default api;
