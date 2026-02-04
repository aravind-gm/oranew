'use client';

// ORA Jewellery - Luxury OTP Login Page
// Uses Backend 8-Digit OTP System (NO PASSWORDS)

import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, Loader2, Sparkles, ArrowLeft } from 'lucide-react';

type LoginStep = 'email' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, user, token, isHydrated } = useAuthStore();

  // Step tracking
  const [step, setStep] = useState<LoginStep>('email');
  
  // Form state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // 🔒 REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!isHydrated) return;

    if (user && token) {
      console.log('[Login] ✅ User already authenticated, redirecting to /account');
      router.replace('/account');
    }
  }, [isHydrated, user, token, router]);

  // OTP TIMER
  useEffect(() => {
    if (otpTimer <= 0) return;
    
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [otpTimer]);

  // 📧 SEND OTP via Backend
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Login] 📧 Requesting OTP for:', email);
      
      // Request OTP from backend - CORRECT PATH (no double /api)
      const response = await api.post('/auth/otp-login', {
        email: email.toLowerCase().trim(),
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to send code');
      }

      console.log('[Login] ✅ OTP requested for:', email);
      setMessage(response.data.message || 'Check your inbox for the login code!');
      setStep('otp');
      setOtpTimer(300); // 5 minutes
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('[Login] ❌ OTP request error:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to send code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFY OTP via Backend
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || otp.length < 6) {
      setError('Please enter the 8-digit code');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Login] ✅ Verifying OTP for:', email);

      // Verify OTP with backend - CORRECT PATH (no double /api)
      const response = await api.post('/auth/verify-otp', {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Verification failed');
      }

      const { user: backendUser, token: jwtToken, isNewUser } = response.data;

      console.log('[Login] ✅ Login successful:', { userId: backendUser.id, isNewUser });

      // Store in AuthStore
      setToken(jwtToken);
      setUser({
        id: backendUser.id,
        email: backendUser.email,
        fullName: backendUser.fullName,
        role: backendUser.role || 'user',
        phone: backendUser.phone,
        profileCompleted: backendUser.profileCompleted,
      });

      setMessage('Welcome to ORA! ✨');

      // Redirect based on profile status
      setTimeout(() => {
        if (isNewUser || !backendUser.profileCompleted || !backendUser.fullName) {
          router.push('/auth/complete-profile');
        } else {
          router.push('/account');
        }
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('[Login] ❌ Verification error:', error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/otp-login', {
        email: email.toLowerCase().trim(),
      });

      if (response.data?.success) {
        setMessage('New code sent! Check your inbox.');
        setOtpTimer(300);
        setOtp('');
      }
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // RESET FORM
  const resetForm = () => {
    setStep('email');
    setOtp('');
    setError('');
    setMessage('');
    setOtpTimer(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Glassmorphic Card */}
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 bg-clip-text text-transparent tracking-wide">
                ORA JEWELLERY
              </h1>
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-serif font-medium text-gray-800 mb-2">
              {step === 'email' ? 'Login or Sign Up' : 'Enter Your Code'}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {step === 'email' 
                ? 'Enter your email to receive a secure login code'
                : `We sent an 8-digit code to ${email}`
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-50/80 backdrop-blur border border-green-200 rounded-2xl">
              <p className="text-green-600 text-sm text-center">{message}</p>
            </div>
          )}

          {/* EMAIL INPUT STEP */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                    disabled={loading}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:via-pink-600 hover:to-amber-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Send Login Code
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP INPUT STEP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  8-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                  maxLength={8}
                  className="w-full px-4 py-4 text-center text-3xl tracking-[0.3em] bg-white/60 backdrop-blur border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 font-mono placeholder:text-gray-300 placeholder:tracking-[0.3em]"
                  disabled={loading}
                  autoFocus
                  autoComplete="one-time-code"
                />
                <div className="flex items-center justify-between mt-3">
                  <p className="text-sm text-gray-500">
                    {otpTimer > 0 
                      ? `Expires in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}`
                      : 'Code expired'
                    }
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading || otpTimer > 0}
                    className="text-sm text-rose-500 hover:text-rose-600 disabled:text-gray-400 font-medium"
                  >
                    Resend Code
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 8}
                className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:via-pink-600 hover:to-amber-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Verify & Continue
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Use a different email
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-center text-sm text-gray-500">
              No password needed — we'll email you a secure code.
              {step === 'email' && (
                <span className="block mt-1 text-gray-400">
                  New accounts are created automatically.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span>🔒</span> Secure
          </span>
          <span className="flex items-center gap-1">
            <span>⚡</span> Instant
          </span>
          <span className="flex items-center gap-1">
            <span>✨</span> Premium
          </span>
        </div>
      </div>
    </div>
  );
}
