import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  createdAt?: string;
  profileCompleted?: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  
  // Actions
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,
  
  fetchUser: async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success && res.data.user) {
        set({ user: res.data.user, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    } catch (error: any) {
      const status = error?.response?.status;

      // Bootstrap hardening:
      // If access token expired, try refresh once, then retry /auth/me.
      if (status === 401) {
        try {
          await api.post('/auth/refresh');
          const retryRes = await api.get('/auth/me');
          if (retryRes.data.success && retryRes.data.user) {
            set({ user: retryRes.data.user, loading: false });
            return;
          }
        } catch {
          // fall through to logged-out state
        }
      }

      // 401 (after refresh attempt) or network error => not authenticated
      set({ user: null, loading: false });
    }
  },
  
  setUser: (user) => {
    set({ user, loading: false });
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      set({ user: null, loading: false });
      // Navigation after logout is handled by the calling component via router.push
    }
  },
  
  updateUser: (user) => {
    set({ user });
  },
}));
