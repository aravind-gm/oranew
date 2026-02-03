'use client';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      // Verify Supabase is configured
      if (!isSupabaseConfigured) {
        setError('Authentication service is not configured');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
        return;
      }

      try {
        console.log('[Auth Callback] 🔗 Processing magic link callback');
        console.log('[Auth Callback] URL:', window.location.href.substring(0, 50) + '...');
        
        // MANDATORY: Exchange code for session FIRST (before any getSession check)
        // This is the only way to convert a magic link token into a valid session
        // However, if exchangeCodeForSession fails (e.g., code verifier missing), 
        // Supabase may have already set the session in the background
        let session = null;
        let exchangeError = null;
        let sessionError = null;

        try {
          const exchangeResult = await supabase.auth.exchangeCodeForSession(
            new URLSearchParams(window.location.search).get('code') || ''
          );
          exchangeError = exchangeResult.error;
          
          // Try to get session regardless of exchange result
          const sessionResult = await supabase.auth.getSession();
          sessionError = sessionResult.error;
          session = sessionResult.data?.session;
        } catch (err: any) {
          // Suppress Supabase refresh token errors - we use JWT instead
          if (err?.message?.includes('refresh') || err?.message?.includes('Refresh Token')) {
            console.warn('[Auth Callback] Suppressing Supabase refresh token error:', err.message);
            // Continue without Supabase session - use our JWT auth instead
          } else {
            throw err;
          }
        }
        
        if (exchangeError) {
          console.warn('[Auth Callback] Exchange error:', exchangeError.message);
          // If we don't have a session after exchange failure, it's a real error
          if (!session) {
            throw new Error('Your login link has expired. Please request a new one.');
          }
          // If we have a session despite exchange error, continue with it
          console.log('[Auth Callback] ⚠️ Exchange had error but session exists, continuing...');
        }

        console.log('[Auth Callback] ✅ Code exchanged successfully');
        
        console.log('[Auth Callback] Session state:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email 
        });

        if (sessionError && !session) {
          console.error('[Auth Callback] Session retrieval error:', sessionError.message);
          throw sessionError;
        }

        if (session?.user) {
          const user = session.user;
          
          console.log('[Auth Callback] ✅ Authenticated user:', user.email);
          
          // Store in auth store
          setToken(session.access_token);
          setUser({
            id: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            phone: user.user_metadata?.phone,
            role: user.user_metadata?.role || 'customer',
          });

          console.log('[Auth Callback] ✅ Auth store synchronized');
          
          // Check if user is new (first time completing profile)
          const isNewUser = !user.user_metadata?.profile_completed;
          const redirectPath = isNewUser ? '/account/complete-profile' : '/account';
          
          console.log(`[Auth Callback] Redirecting to ${redirectPath}`);
          
          // Redirect with appropriate destination
          setTimeout(() => {
            router.push(redirectPath);
          }, 500);
        } else {
          // Session should exist after successful code exchange
          console.error('[Auth Callback] ❌ No session after code exchange');
          throw new Error('Your login link has expired. Please request a new one.');
        }
      } catch (err: any) {
        console.error('[Auth Callback Error]', err);
        const errorMessage = err?.message || 'Your login link has expired. Please request a new one.';
        setError(errorMessage);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // Process callback immediately
    handleCallback();
  }, [router, setToken, setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Logging you in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-sm w-full">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-red-600 font-medium">Sign-in Failed</p>
              <p className="text-text-muted text-sm mt-1">{error}</p>
            </div>
            <p className="text-text-muted text-xs">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
