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

// Track if we're currently handling 401 to prevent loops
let isHandling401 = false;

// 401 handler - redirect to login for cookie-based auth
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window !== 'undefined' && error.response?.status === 401 && !isHandling401) {
      isHandling401 = true;
      try {
        // Cookie-based auth: 401 means session expired
        // Backend handles cookie refresh automatically
        // Redirect to login for re-authentication
        console.warn('[API] 🔐 Unauthorized (401). Redirecting to login.');
        window.location.href = '/auth/login';
        return Promise.reject(error);
      } finally {
        isHandling401 = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
