/**
 * Vercel Serverless Backend API Client
 * Updated for serverless architecture
 * 
 * Communicates with /api/* endpoints on Vercel
 * All requests include JWT token in Authorization header
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

// Request interceptor - Add auth token from localStorage
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

// Response interceptor - Handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 🛑 CRITICAL: Never logout on backend API 401 errors
    // Backend 401 does NOT mean authentication is invalid
    // It means this specific endpoint doesn't accept our token format
    // 
    // Example:
    // - User is authenticated with Supabase + AuthStore
    // - Backend API doesn't recognize Supabase tokens
    // - API returns 401
    // - Frontend should NOT logout or redirect
    // - User stays logged in, page shows error message
    
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      console.log('[API] ⚠️ Backend API returned 401 (not an auth failure)');
      console.log('[API] Supabase session status:', { 
        hasToken: !!authStore.token, 
        hasUser: !!authStore.user,
        isHydrated: authStore.isHydrated 
      });
      
      // ✅ DO NOT logout
      // ✅ DO NOT clear token
      // ✅ DO NOT redirect to login
      // Just log and return error for page to handle
      console.log('[API] ✅ Keeping user logged in — backend may have different token requirements');
    }
    
    return Promise.reject(error);
  }
);

export default api;
