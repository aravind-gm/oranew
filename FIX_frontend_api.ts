import { useAuthStore } from '@/store/authStore';
import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token (browser only)
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      // Try to get token from both store (if hydrated) and localStorage (fallback)
      const authStore = useAuthStore.getState();
      const storeToken = authStore.token;
      const localToken = localStorage.getItem('ora_token');
      const token = storeToken || localToken;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        
        // CRITICAL: Do NOT set Content-Type for FormData (file uploads)
        // Axios/browser will automatically set the correct multipart/form-data with boundary
        if (config.data instanceof FormData) {
          // Remove the default Content-Type header for FormData
          delete config.headers['Content-Type'];
          console.log('[Axios] 📤 FormData detected - removed Content-Type header for proper multipart handling');
        }
        
        // Log token details for ADMIN endpoints, orders, and payments
        const isAdminRequest = config.url?.includes('admin') || config.url?.includes('upload');
        if (isAdminRequest || config.url?.includes('orders') || config.url?.includes('payments')) {
          console.log('[Axios] 🔐 Token attached to request:', {
            endpoint: config.url,
            method: config.method,
            hasToken: !!token,
            tokenPrefix: token.substring(0, 20) + '...',
            fromStore: !!storeToken,
            fromLocalStorage: !storeToken && !!localToken,
            authHeaderSet: !!config.headers.Authorization,
            contentType: config.headers['Content-Type'] || 'auto (FormData)',
            isFormData: config.data instanceof FormData,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        console.warn('[Axios] ⚠️ No token found (store or localStorage) for request to:', {
          endpoint: config.url,
          method: config.method,
          isAdminRequest: config.url?.includes('admin'),
          timestamp: new Date().toISOString(),
        });
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle 401 errors gracefully with clear messaging
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const authStore = useAuthStore.getState();
      const localToken = localStorage.getItem('ora_token');
      const hasToken = authStore.token || localToken;
      
      // Extract endpoint for logging
      const endpoint = (error.config?.url || '').replace(process.env.NEXT_PUBLIC_API_URL || '', '');
      const isAdminRequest = endpoint.includes('admin') || endpoint.includes('upload');
      
      // Log detailed 401 situation
      console.error('[Axios 401 Unauthorized]', {
        endpoint,
        method: error.config?.method,
        isAdminRequest,
        hasTokenInStore: !!authStore.token,
        hasTokenInLocalStorage: !!localToken,
        statusCode: error.response?.status,
        responseData: error.response?.data,
        timestamp: new Date().toISOString(),
      });
      
      // If NO token exists, user is not authenticated - redirect to login
      if (!hasToken) {
        console.log('[Axios] ❌ No token found. User not authenticated. Redirecting to login...');
        localStorage.removeItem('ora_token');
        authStore.logout();
        
        // Use setTimeout to avoid infinite redirect loops
        setTimeout(() => {
          if (window.location.pathname !== '/auth/login') {
            const redirect = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/auth/login?redirect=${redirect}`;
          }
        }, 500);
      } else {
        // Token EXISTS but was REJECTED by server
        // This means: token is invalid, expired, or user lacks admin role
        console.error('[Axios] Token exists but server rejected it. Logging out and redirecting to login...');
        localStorage.removeItem('ora_token');
        authStore.logout();
        
        setTimeout(() => {
          if (window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login?error=token_invalid';
          }
        }, 500);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
