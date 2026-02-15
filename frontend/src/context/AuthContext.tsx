'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: string;
  role: string;
  profileCompleted?: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateProfile?: (user: Partial<User>) => void; // Alias for updateUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    // console.log('[AuthContext] 💧 Hydrating auth state from localStorage...');
    
    try {
      const storedToken = localStorage.getItem('ora_token');
      const storedUser = localStorage.getItem('ora_user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Session found — debug removed for production
        setToken(storedToken);
        setUser(parsedUser);
      } else {
        // console.log('[AuthContext] ℹ️ No existing session found');
      }
    } catch (error) {
      console.error('[AuthContext] ❌ Error loading auth state:', error);
    } finally {
      setIsLoading(false);
      // console.log('[AuthContext] ✅ Hydration complete');
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    // Login — debug removed for production
    
    // Save to state
    setUser(userData);
    setToken(authToken);
    
    // Persist to localStorage
    localStorage.setItem('ora_token', authToken);
    localStorage.setItem('ora_user', JSON.stringify(userData));
    
    // console.log('[AuthContext] ✅ Login successful, state persisted');
  };

  const logout = () => {
    // console.log('[AuthContext] 🚪 Logging out user');
    
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('ora_token');
    localStorage.removeItem('ora_user');
    
    // Also clear old token format if exists
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // console.log('[AuthContext] ✅ Logout complete');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    // console.log('[AuthContext] 👤 Updating user:', updates);
    
    setUser(updatedUser);
    localStorage.setItem('ora_user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
    updateProfile: updateUser, // Alias
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
