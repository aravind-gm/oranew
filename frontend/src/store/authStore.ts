import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  
  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      
      setUser: (user) => {
        // User data fetched from /api/auth/me
        // Only persist user info, never tokens (HttpOnly cookies)
        set({ user });
      },
      
      logout: () => {
        // Clear user state (cookies cleared by backend)
        set({ user: null });
      },
      
      updateUser: (user) => {
        // Update user profile data
        set({ user });
      },
    }),
    {
      name: 'ora-auth',
      storage: (() => {
        // Custom storage with explicit write control
        return {
          getItem: (name: string) => {
            if (typeof window === 'undefined') return null;
            try {
              const item = localStorage.getItem(name);
              return item ? JSON.parse(item) : null;
            } catch (error) {
              console.error('[AuthStore Storage] Failed to parse localStorage:', error);
              return null;
            }
          },
          setItem: (name: string, value: any) => {
            if (typeof window === 'undefined') return;
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch (error) {
              console.error('[AuthStore Storage] Failed to write to localStorage:', error);
            }
          },
          removeItem: (name: string) => {
            if (typeof window === 'undefined') return;
            try {
              localStorage.removeItem(name);
            } catch (error) {
              console.error('[AuthStore Storage] Failed to remove from localStorage:', error);
            }
          },
        };
      })(),
      // Only persist user data, never tokens
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
