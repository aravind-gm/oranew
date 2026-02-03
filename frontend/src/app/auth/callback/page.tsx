'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// ============================================
// PASSWORD RESET CALLBACK PAGE
// ============================================
// Handles password reset tokens from email links
// Format: /auth/callback?token=xxx&type=password-reset

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        console.log('[Auth Callback] Processing token:', { type, tokenExists: !!token });

        // Check if this is a password reset token
        if (type === 'password-reset' && token) {
          console.log('[Auth Callback] ✅ Valid password reset token detected');
          
          // Redirect to reset password page with token
          router.push(`/auth/reset-password?token=${encodeURIComponent(token)}`);
        } else if (!token) {
          console.error('[Auth Callback] ❌ No token provided');
          setError('Invalid or expired link. Please request a new password reset.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        } else {
          console.error('[Auth Callback] ❌ Unknown callback type:', type);
          setError('Invalid callback type.');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } catch (err: any) {
        console.error('[Auth Callback Error]', err);
        setError(err?.message || 'An error occurred. Please try again.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router, searchParams]);

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
