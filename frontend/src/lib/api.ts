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
    // Handle 401 Unauthorized
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
