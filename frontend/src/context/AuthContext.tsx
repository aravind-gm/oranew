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

  // Load auth state from memory on mount
  useEffect(() => {
    // console.log('[AuthContext] 💧 Initializing auth state...');
    
    try {
      // Note: HttpOnly cookies are automatically sent by browser
      // We don't store tokens in localStorage anymore
      // Auth state will be populated by /api/auth/me endpoint
      setIsLoading(false);
    } catch (error) {
      console.error('[AuthContext] ❌ Error initializing auth:', error);
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    // Cookie-based auth: token is handled by backend via HttpOnly cookies
    // We don't store tokens in localStorage
    
    // Save user data to state only (for display purposes)
    setUser(userData);
    setToken(authToken); // Keep in memory only, not persisted
    
    // Still store user in localStorage for display (name, email, etc)
    localStorage.setItem('ora_user', JSON.stringify(userData));
    
    // console.log('[AuthContext] ✅ Login successful, user state updated');
  };

  const logout = () => {
    // console.log('[AuthContext] 🚪 Logging out user');
    
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear localStorage (keep only user data until fully cleared)
    localStorage.removeItem('ora_user');
    
    // HttpOnly cookies are cleared by backend on /auth/logout endpoint
    
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
