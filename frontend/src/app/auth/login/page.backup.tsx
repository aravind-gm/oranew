'use client';

// OTP Login Page - Supabase Email OTP Authentication
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type LoginStep = 'email-input' | 'otp-input' | 'admin-input';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, user, token, isHydrated } = useAuthStore();

  // Step tracking
  const [step, setStep] = useState<LoginStep>('email-input');
  
  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [showAdminForm, setShowAdminForm] = useState(false);

  // 🔒 REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!isHydrated) return;

    if (user && token) {
      console.log('[Login] ✅ User already authenticated, redirecting to /account');
      router.replace('/account');
    }
  }, [isHydrated, user, token, router]);

  // 🔐 ADMIN SHORTCUT (DEV ONLY)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAdminForm(!showAdminForm);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAdminForm]);

  // OTP TIMER
  useEffect(() => {
    if (otpTimer <= 0) return;
    
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [otpTimer]);

  // 📧 SEND OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Login] 📧 Sending OTP to:', email);
      
      // Request OTP from Supabase
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        console.error('[Login] ❌ OTP error:', otpError.message);
        
        if (otpError.message?.includes('rate limit')) {
          setError('Too many requests. Please wait a few minutes before trying again.');
        } else if (otpError.message?.includes('invalid')) {
          setError('Invalid email address. Please check and try again.');
        } else {
          setError(otpError.message || 'Failed to send OTP');
        }
        return;
      }

      console.log('[Login] ✅ OTP sent to:', email);
      setMessage(`OTP sent to ${email}. Check your inbox!`);
      setStep('otp-input');
      setOtpTimer(300); // 5 minutes
    } catch (err: any) {
      console.error('[Login] ❌ OTP send error:', err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFY OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length < 8) {
      setError('Please enter a valid 8-digit OTP');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Login] ✅ Verifying OTP for:', email);

      // Verify OTP with Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError || !data.session) {
        console.error('[Login] ❌ OTP verification failed:', verifyError?.message);
        setError('Invalid OTP. Please check and try again.');
        return;
      }

      console.log('[Login] ✅ OTP verified:', { userId: data.user?.id });

      // Get Supabase user
      const supabaseUser = data.user;
      if (!supabaseUser) {
        throw new Error('No user returned from Supabase');
      }

      // ============================================
      // CRITICAL: Call backend with supabaseId
      // ============================================
      // The backend REQUIRES supabaseId to:
      // 1. Find or create user in database
      // 2. Link Supabase auth to backend user
      // 3. Return JWT for protected endpoints
      //
      // If supabaseId is missing or empty:
      // - Backend will return 400 error
      // - Frontend should retry (retryable: true)
      // - After 3 retries, give up and show error

      const supabaseId = supabaseUser.id;
      if (!supabaseId) {
        throw new Error('No supabaseId from Supabase user (auth flow broken)');
      }

      console.log('[Login] 📤 Sending to backend with supabaseId:', {
        supabaseId: supabaseId.slice(0, 8) + '...', // Don't log full ID
        email: supabaseUser.email,
        fullName: supabaseUser.user_metadata?.full_name || '(not set)',
      });

      // ============================================
      // BACKEND CALL WITH RETRY LOGIC
      // ============================================
      // If the backend is temporarily down, retry up to 3 times
      // But if we get a 400 error, don't retry (validation error)

      let backendData = null;
      let lastError = null;
      let retryCount = 0;
      const MAX_RETRIES = 3; // Force Vercel redeploy

      for (retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
        try {
          const response = await api.post('/api/auth/otp-login', {
            supabaseId,
            email: supabaseUser.email,
            fullName: supabaseUser.user_metadata?.full_name || '',
          });

          backendData = response.data;
          console.log('[Login] 📥 Backend response (attempt', retryCount + 1, '):', backendData);
          break; // Success, exit retry loop
        } catch (err: any) {
          lastError = err;

          // Check if error is retryable
          if (err.response?.status === 400) {
            // 400: Bad request (non-retryable)
            // Usually means validation error
            console.error('[Login] ❌ Backend validation error (400):', err.response?.data);
            throw err; // Don't retry validation errors
          }

          if (err.response?.status === 401 || err.response?.status === 403) {
            // 401/403: Auth error (non-retryable)
            console.error('[Login] ❌ Backend auth error:', err.response?.data);
            throw err;
          }

          // 5xx or network error: retryable
          if (retryCount < MAX_RETRIES - 1) {
            const delayMs = 500 * Math.pow(2, retryCount); // Exponential backoff
            console.warn('[Login] 🔄 Retrying backend call (attempt', retryCount + 2, '/', MAX_RETRIES, ') in', delayMs, 'ms');
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            console.error('[Login] ❌ Max retries exceeded');
            throw err;
          }
        }
      }

      if (!backendData) {
        throw lastError || new Error('Backend call failed');
      }

      if (!backendData?.success) {
        throw new Error(backendData?.error || 'Backend login failed');
      }

      const { user: backendUser, token: jwtToken } = backendData.data;

      console.log('[Login] ✅ Backend login successful:', { userId: backendUser.id });

      // Store in AuthStore
      setToken(jwtToken);
      setUser({
        id: backendUser.id,
        email: backendUser.email,
        fullName: backendUser.fullName,
        role: backendUser.role || 'user',
      });

      setMessage('Login successful! Redirecting...');

      // Let the redirect guard handle it
      setTimeout(() => {
        router.push('/account');
      }, 500);
    } catch (err: any) {
      console.error('[Login] ❌ Verification error:', err);

      // Log backend response error details
      if (err.response?.data) {
        console.error('[Login] 📥 Backend error response:', err.response.data);
      }

      if (err.response?.status === 400) {
        console.error('[Login] ❌ Backend validation error (400):', {
          status: err.response.status,
          data: err.response.data,
        });
      }

      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🔑 ADMIN PASSWORD LOGIN (DEV ONLY - Uses separate endpoint)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (process.env.NODE_ENV === 'production') {
      setError('Admin login not available in production');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('[Login] 🔐 Admin login attempt for:', adminEmail);

      // ============================================
      // IMPORTANT: Admin login flow is SEPARATE
      // ============================================
      // Do NOT use OTP login endpoint!
      // Admin login:
      // 1. Email + password (NOT Supabase OTP)
      // 2. Uses /api/auth/admin-login endpoint
      // 3. Returns JWT if credentials valid
      //
      // This is completely separate from user OTP login

      const { data: backendData } = await api.post('/auth/admin-login', {
        email: adminEmail,
        password: adminPassword,
      });

      if (!backendData?.success) {
        throw new Error(backendData?.error || 'Admin login failed');
      }

      const backendUser = backendData.data?.user;
      const jwtToken = backendData.data?.token;

      if (backendUser?.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      console.log('[Login] ✅ Admin login successful:', { userId: backendUser.id });

      // Store in AuthStore
      setToken(jwtToken);
      setUser({
        id: backendUser.id,
        email: backendUser.email,
        fullName: backendUser.fullName,
        role: 'ADMIN',
      });

      setMessage('Admin login successful! Redirecting...');

      setTimeout(() => {
        router.push('/admin');
      }, 500);
    } catch (err: any) {
      console.error('[Login] ❌ Admin error:', err);
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  // RESET FORM
  const resetForm = () => {
    setStep('email-input');
    setEmail('');
    setOtp('');
    setError('');
    setMessage('');
    setOtpTimer(0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:p-8 bg-white lg:bg-transparent">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8 lg:mb-12">
            <span className="text-3xl font-serif font-bold text-accent tracking-wide">ORA</span>
          </Link>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-text-primary mb-3">
              {showAdminForm ? 'Admin Login' : 'Welcome Back'}
            </h1>
            <p className="text-text-muted">
              {showAdminForm 
                ? 'Enter your admin credentials' 
                : step === 'email-input' 
                  ? 'Enter your email to receive a login code'
                  : `Enter the 6-digit code sent to ${email}`
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-green-600 text-sm">{message}</p>
            </div>
          )}

          {/* ADMIN FORM */}
          {showAdminForm ? (
            <form onSubmit={handleAdminLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@orashop.in"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Login as Admin
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAdminForm(false);
                  setAdminEmail('');
                  setAdminPassword('');
                  setError('');
                }}
                className="w-full text-text-muted hover:text-text-primary font-medium py-2 transition"
              >
                Back to User Login
              </button>
            </form>
          ) : (
            <>
              {/* EMAIL INPUT STEP */}
              {step === 'email-input' && (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent/90 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send Login Code
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OTP INPUT STEP */}
              {step === 'otp-input' && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Login Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="00000000"
                      maxLength={8}
                      className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition font-mono"
                      disabled={loading}
                      autoFocus
                    />
                    <p className="text-xs text-text-muted mt-2">
                      {otpTimer > 0 
                        ? `Code expires in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}`
                        : 'Code expired. Request a new one.'
                      }
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 8}
                    className="w-full bg-accent hover:bg-accent/90 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Verify Code
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full text-text-muted hover:text-text-primary font-medium py-2 transition"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </>
          )}

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-text-muted">
            Don't have an account?{' '}
            <span className="text-text-muted">
              It will be created automatically when you log in.
            </span>
          </p>
        </div>
      </div>

      {/* Right Side - Marketing */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent/20 via-background to-accent/10 flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-4xl font-serif font-bold text-text-primary mb-6">
            own. radiate. adorn.
          </h2>
          <p className="text-text-muted mb-12 leading-relaxed">
            Experience the perfect blend of elegance and affordability with ORA's premium artificial jewellery collection.
          </p>

          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="h-1 w-12 bg-accent rounded-full" />
            <div className="h-1 w-2 bg-accent/30 rounded-full" />
            <div className="h-1 w-2 bg-accent/30 rounded-full" />
          </div>

          <div className="flex gap-8 justify-center">
            <div>
              <p className="text-3xl font-serif font-bold text-accent">10k+</p>
              <p className="text-text-muted text-sm">Happy Customers</p>
            </div>
            <div>
              <p className="text-3xl font-serif font-bold text-accent">4.9</p>
              <p className="text-text-muted text-sm">Rating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
