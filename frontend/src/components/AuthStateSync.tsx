'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * AuthStateSync - Initialize auth state on app load
 * 
 * This component:
 * - Fetches user data from /api/auth/me using HttpOnly cookies
 * - Runs once on initial app load
 * - Prevents race conditions by waiting for loading state
 * - No localStorage, no Supabase - pure cookie-based auth
 */
export default function AuthStateSync() {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    // Fetch user on mount - reads from HttpOnly cookie
    fetchUser();
  }, [fetchUser]);

  // This component has no UI
  return null;
}
