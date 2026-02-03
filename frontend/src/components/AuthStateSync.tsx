'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

/**
 * AuthStateSync - Syncs Supabase auth state to AuthStore
 * 
 * DISABLED: This component is disabled because:
 * - App uses JWT tokens from backend, NOT Supabase tokens
 * - Supabase auth listener triggers automatic token refresh attempts
 * - This causes "Invalid Refresh Token" errors since we don't use Supabase refresh tokens
 * - JWT auth is managed entirely through AuthStore (localStorage)
 * 
 * To re-enable if switching back to Supabase auth:
 * 1. Uncomment the useEffect hook below
 * 2. Re-enable autoRefreshToken in supabase.ts
 * 3. Ensure Supabase refresh token is properly provided
 */
export default function AuthStateSync() {
  // Auth state sync disabled - using JWT backend auth instead
  return null;
  
  /*
  const { user: authStoreUser, token: authStoreToken, setUser, setToken, logout } = useAuthStore();

  useEffect(() => {
    console.log('[AuthStateSync] 🔄 Setting up Supabase auth listener...');

    // Subscribe to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthStateSync] 🔐 Auth event:', event, {
          hasSession: !!session,
          email: session?.user?.email,
          userId: session?.user?.id,
        });

        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in - sync to AuthStore if not already synced
          console.log('[AuthStateSync] ✅ User signed in, syncing to AuthStore...');
          
          // Only update if AuthStore doesn't already have this user
          // (prevents unnecessary re-renders and race conditions)
          if (!authStoreUser || authStoreUser.id !== session.user.id) {
            setToken(session.access_token);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || 'User',
              firstName: session.user.user_metadata?.first_name,
              lastName: session.user.user_metadata?.last_name,
              phone: session.user.user_metadata?.phone,
              role: session.user.user_metadata?.role || 'user',
            });
            console.log('[AuthStateSync] ✨ AuthStore updated with Supabase user');
          } else {
            console.log('[AuthStateSync] ℹ️ AuthStore already has this user, skipping update');
          }
        } 
        else if (event === 'SIGNED_OUT') {
          // User signed out - sync to AuthStore
          console.log('[AuthStateSync] 🚪 User signed out, clearing AuthStore...');
          
          if (authStoreUser || authStoreToken) {
            logout();
            console.log('[AuthStateSync] ✨ AuthStore cleared');
          }
        }
        else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Token refreshed - update token in AuthStore
          console.log('[AuthStateSync] 🔄 Token refreshed, syncing new token...');
          
          if (authStoreToken !== session.access_token) {
            setToken(session.access_token);
            console.log('[AuthStateSync] ✨ AuthStore token updated');
          }
        }
        else if (event === 'INITIAL_SESSION' && session?.user) {
          // Initial session recovered from storage on app load
          console.log('[AuthStateSync] 🔄 Initial session recovered from storage');
          
          if (!authStoreUser || authStoreUser.id !== session.user.id) {
            setToken(session.access_token);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || 'User',
              firstName: session.user.user_metadata?.first_name,
              lastName: session.user.user_metadata?.last_name,
              phone: session.user.user_metadata?.phone,
              role: session.user.user_metadata?.role || 'user',
            });
            console.log('[AuthStateSync] ✨ AuthStore synced with recovered session');
          }
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log('[AuthStateSync] 🧹 Cleaning up auth listener');
      subscription?.unsubscribe();
    };
  }, [authStoreUser, authStoreToken, setUser, setToken, logout]);

  // This component doesn't render anything, it just syncs state
  return null;
  */
}
