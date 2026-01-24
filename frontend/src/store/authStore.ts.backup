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
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  setHydrated: (hydrated: boolean) => void;
  
  // Explicit hydration check
  ensureHydrated: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
      
      login: (user, token) => {
        console.log('[AuthStore] 🔐 Logging in user:', { email: user.email, role: user.role });
        localStorage.setItem('ora_token', token);
        set({ user, token, isAuthenticated: true });
      },
      
      logout: () => {
        console.log('[AuthStore] 🚪 Logging out user');
        localStorage.removeItem('ora_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (user) => {
        console.log('[AuthStore] 👤 Updating user:', { email: user.email });
        set({ user });
      },
      
      setToken: (token) => {
        console.log('[AuthStore] 🔑 Setting token');
        localStorage.setItem('ora_token', token);
        set({ token, isAuthenticated: true });
      },
      
      setUser: (user) => {
        console.log('[AuthStore] 👥 Setting user:', { email: user.email });
        set({ user, isAuthenticated: true });
      },
      
      setHydrated: (hydrated) => {
        if (hydrated && !get().isHydrated) {
          console.log('[AuthStore] 💧 Store hydrated from localStorage', {
            hasToken: !!get().token,
            hasUser: !!get().user,
          });
        }
        set({ isHydrated: hydrated });
      },
      
      // Explicitly wait for hydration - useful in components
      ensureHydrated: async () => {
        const state = get();
        if (state.isHydrated) return;
        
        // Wait up to 3 seconds for hydration
        return new Promise<void>((resolve) => {
          const unsubscribe = useAuthStore.subscribe(
            (newState) => newState.isHydrated,
            (isHydrated) => {
              if (isHydrated) {
                unsubscribe();
                resolve();
              }
            }
          );
          
          setTimeout(() => {
            unsubscribe();
            resolve(); // Resolve anyway after timeout
          }, 3000);
        });
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
      // Only rehydrate specific properties, not every state change
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
