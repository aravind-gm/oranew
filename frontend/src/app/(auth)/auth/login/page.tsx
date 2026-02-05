'use client';

// ORA Jewellery - Unified Login & Signup Page
// Two-way authentication: Password + OTP
// Deploy: 2026-02-05

import { useAuth } from '@/context/AuthContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, Sparkles, ArrowLeft, User, Eye, EyeOff, Phone } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type LoginMethod = 'password' | 'otp';
type LoginStep = 'form' | 'otp-verify';

export default function LoginPage() {
  const router = useRouter();
  const { login, user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const authStore = useAuthStore();

  // Mode: Login or Signup
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Login method: Password or OTP
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');
  
  // Step tracking (for OTP flow)
  const [step, setStep] = useState<LoginStep>('form');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // 🔒 REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (authLoading) return;

    if (isAuthenticated && user) {
      console.log('[Auth] ✅ User already authenticated, redirecting to /account');
      router.replace('/account');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // OTP TIMER
  useEffect(() => {
    if (otpTimer <= 0) return;
    
    const interval = setInterval(() => {
      setOtpTimer((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Reset form when switching modes
  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setStep('form');
    setError('');
    setMessage('');
    setOtp('');
    if (mode === 'login') {
      setFullName('');
      setConfirmPassword('');
      setPhone('');
    }
  };

  // 🔐 PASSWORD LOGIN
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Auth] 🔐 Password login for:', email);
      
      const response = await api.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Login failed');
      }

      const { user: userData, token: jwtToken } = response.data;

      console.log('[Auth] ✅ Password login successful:', userData.email);

      const userPayload = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || 'CUSTOMER',
        phone: userData.phone,
        profileCompleted: userData.profileCompleted,
      };

      // Store in AuthContext (this syncs to localStorage)
      login(userPayload, jwtToken);

      // CRITICAL: Also update AuthStore for Header to detect login
      authStore.login(userPayload, jwtToken);

      setMessage('Welcome back! ✨');

      // Redirect based on role
      setTimeout(() => {
        if (userData.role === 'ADMIN') {
          router.push('/admin');
        } else if (!userData.profileCompleted || !userData.fullName) {
          router.push('/auth/complete-profile');
        } else {
          router.push('/account');
        }
        router.refresh();
      }, 500);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('[Auth] ❌ Login error:', error);
      setError(error.response?.data?.error || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // 📧 SEND OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Auth] 📧 Requesting OTP for:', email);
      
      const response = await api.post('/auth/otp-login', {
        email: email.toLowerCase().trim(),
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to send code');
      }

      console.log('[Auth] ✅ OTP sent to:', email);
      setMessage('Check your inbox for the 8-digit login code!');
      setStep('otp-verify');
      setOtpTimer(300); // 5 minutes

    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('[Auth] ❌ OTP error:', error);
      setError(error.response?.data?.error || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFY OTP
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
      console.log('[Auth] ✅ Verifying OTP for:', email);

      const response = await api.post('/auth/verify-otp', {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Verification failed');
      }

      const { user: userData, token: jwtToken, isNewUser } = response.data;

      console.log('[Auth] ✅ OTP verified:', { userId: userData.id, isNewUser });

      const userPayload = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || 'CUSTOMER',
        phone: userData.phone,
        profileCompleted: userData.profileCompleted,
      };

      // Store in AuthContext
      login(userPayload, jwtToken);

      // CRITICAL: Also update AuthStore for Header to detect login
      authStore.login(userPayload, jwtToken);

      setMessage('Welcome to ORA! ✨');

      // Redirect based on role
      setTimeout(() => {
        if (userData.role === 'ADMIN') {
          router.push('/admin');
        } else if (isNewUser || !userData.profileCompleted || !userData.fullName) {
          router.push('/auth/complete-profile');
        } else {
          router.push('/account');
        }
        router.refresh();
      }, 500);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('[Auth] ❌ Verification error:', error);
      setError(error.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // 📝 SIGNUP WITH PASSWORD
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Auth] 📝 Signing up:', email);
      
      const response = await api.post('/auth/register', {
        email: email.toLowerCase().trim(),
        password: password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Registration failed');
      }

      const { user: userData, token: jwtToken } = response.data;

      console.log('[Auth] ✅ Signup successful:', userData.email);

      const userPayload = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || 'CUSTOMER',
        phone: userData.phone,
        profileCompleted: userData.profileCompleted,
      };

      // Store in AuthContext
      login(userPayload, jwtToken);

      // CRITICAL: Also update AuthStore for Header to detect login
      authStore.login(userPayload, jwtToken);

      setMessage('Account created successfully! Welcome to ORA! ✨');

      // Redirect to account
      setTimeout(() => {
        router.push('/account');
        router.refresh();
      }, 1000);

    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('[Auth] ❌ Signup error:', error);
      setError(error.response?.data?.error || error.message || 'Registration failed');
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

  // Reset to form
  const resetToForm = () => {
    setStep('form');
    setOtp('');
    setError('');
    setMessage('');
    setOtpTimer(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Glassmorphic Card */}
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 bg-clip-text text-transparent tracking-wide">
                ORA JEWELLERY
              </h1>
            </Link>
          </div>

          {/* Auth Mode Tabs */}
          <div className="flex mb-6 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => switchAuthMode('login')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-rose-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => switchAuthMode('signup')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                authMode === 'signup'
                  ? 'bg-white text-rose-600 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50/80 backdrop-blur border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="mb-4 p-4 bg-green-50/80 backdrop-blur border border-green-200 rounded-2xl">
              <p className="text-green-600 text-sm text-center">{message}</p>
            </div>
          )}

          {/* ========== LOGIN MODE ========== */}
          {authMode === 'login' && step === 'form' && (
            <>
              {/* Login Method Tabs */}
              <div className="flex mb-6 gap-2">
                <button
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'password'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Password
                </button>
                <button
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                    loginMethod === 'otp'
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email Code
                </button>
              </div>

              {/* PASSWORD LOGIN FORM */}
              {loginMethod === 'password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-12 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                        disabled={loading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim() || !password.trim()}
                    className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:via-pink-600 hover:to-amber-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:shadow-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Login
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OTP LOGIN FORM */}
              {loginMethod === 'otp' && (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                        disabled={loading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:via-pink-600 hover:to-amber-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:shadow-none"
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

                  <p className="text-center text-sm text-gray-500 mt-3">
                    We&apos;ll send an 8-digit code to your email
                  </p>
                </form>
              )}
            </>
          )}

          {/* ========== OTP VERIFICATION STEP ========== */}
          {authMode === 'login' && step === 'otp-verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Enter Code</h2>
                <p className="text-gray-500 text-sm mt-1">
                  We sent an 8-digit code to {email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  8-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                  maxLength={8}
                  className="w-full px-4 py-4 text-center text-2xl tracking-[0.3em] bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 font-mono placeholder:text-gray-300"
                  disabled={loading}
                  autoFocus
                  autoComplete="one-time-code"
                />
                <div className="flex items-center justify-between mt-2">
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
                className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:via-pink-600 hover:to-amber-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Verify & Login
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetToForm}
                className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Use a different email
              </button>
            </form>
          )}

          {/* ========== SIGNUP MODE ========== */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Create Account</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Join ORA Jewellery today
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                    disabled={loading}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-12 pr-12 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-12 pr-4 py-3.5 bg-white/60 backdrop-blur border border-gray-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim() || !fullName.trim() || !confirmPassword.trim()}
                className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:via-pink-600 hover:to-amber-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:shadow-none mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                By signing up, you agree to our{' '}
                <Link href="/terms" className="text-rose-500 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-rose-500 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200/50">
            <p className="text-center text-sm text-gray-500">
              {authMode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => switchAuthMode('signup')}
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => switchAuthMode('login')}
                    className="text-rose-500 hover:text-rose-600 font-medium"
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            🔒 Secure
          </span>
          <span className="flex items-center gap-1">
            ⚡ Instant
          </span>
          <span className="flex items-center gap-1">
            ✨ Premium
          </span>
        </div>
      </div>
    </div>
  );
}
