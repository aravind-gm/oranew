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
    } catch (error) {
      // 401 or network error = not authenticated
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
      window.location.href = '/auth/login';
    }
  },
  
  updateUser: (user) => {
    set({ user });
  },
}));
