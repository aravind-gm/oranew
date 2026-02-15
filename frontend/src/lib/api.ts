/**
 * ORA Jewellery — Backend API Client
 * 
 * Features:
 * - Communicates with Render backend
 * - Automatic retry on 503 (backend cold start)
 * - JWT token injection
 * - 401 token refresh before logout
 * - Graceful error handling
 */

import { useAuthStore } from '@/store/authStore';
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
  timeout: 10000, // 10s timeout (reduced from 30s)
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

// Track if we're currently refreshing to prevent loops
let isRefreshing = false;

// 401 handler with token refresh attempt
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window !== 'undefined' && error.response?.status === 401 && !isRefreshing) {
      const authStore = useAuthStore.getState();
      
      // Only attempt refresh if user was previously authenticated
      if (authStore.token && authStore.user) {
        isRefreshing = true;
        try {
          // Try to refresh the Supabase session
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          );
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          
          if (data?.session && !refreshError) {
            // Update the store with new token
            authStore.setToken(data.session.access_token);
            
            // Retry the original request with new token
            if (error.config) {
              error.config.headers.Authorization = `Bearer ${data.session.access_token}`;
              return api.request(error.config);
            }
          }
        } catch {
          // Refresh failed silently — don't logout, let user continue browsing
        } finally {
          isRefreshing = false;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
