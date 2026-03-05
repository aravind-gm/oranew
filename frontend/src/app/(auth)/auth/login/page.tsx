'use client';

// ORA Jewellery - Premium Login & Signup Page
// Glassmorphic UI | Two-way auth: Password + OTP

import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, ArrowLeft, User, Eye, EyeOff, Phone, ShieldCheck, Zap, Star } from 'lucide-react';

type AuthMode = 'login' | 'signup';
type LoginMethod = 'password' | 'otp';
type LoginStep = 'form' | 'otp-verify';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  // Mode: Login or Signup
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Login method: Password or OTP (OTP is default/priority)
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('otp');
  
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
      // console.log('[Auth] 🔐 Password login for:', email);
      
      const response = await api.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password: password,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Login failed');
      }

      const { user: userData } = response.data;

      // console.log('[Auth] ✅ Password login successful:', userData.email);

      const userPayload = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || 'CUSTOMER',
        phone: userData.phone,
        profileCompleted: userData.profileCompleted,
      };

      // Store user in AuthStore (cookies already set by backend)
      setUser(userPayload);

      setMessage('Welcome back! ✨');

      const redirectPath =
        userData.role === 'ADMIN' ? '/admin' :
        (!userData.profileCompleted || !userData.fullName) ? '/auth/complete-profile' :
        '/account';
      router.push(redirectPath);

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
      // console.log('[Auth] 📧 Requesting OTP for:', email);
      
      const response = await api.post('/auth/otp-login', {
        email: email.toLowerCase().trim(),
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to send code');
      }

      // console.log('[Auth] ✅ OTP sent to:', email);
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
      // console.log('[Auth] ✅ Verifying OTP for:', email);

      const response = await api.post('/auth/verify-otp', {
        email: email.toLowerCase().trim(),
        otp: otp.trim(),
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Verification failed');
      }

      const { user: userData, isNewUser } = response.data;

      // console.log('[Auth] ✅ OTP verified:', { userId: userData.id, isNewUser });

      const userPayload = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || 'CUSTOMER',
        phone: userData.phone,
        profileCompleted: userData.profileCompleted,
      };

      // Store user in AuthStore (cookies already set by backend)
      setUser(userPayload);

      setMessage('Welcome to ORA! ✨');

      // Redirect based on role
      const redirectPath =
        userData.role === 'ADMIN' ? '/admin' :
        (isNewUser || !userData.profileCompleted || !userData.fullName) ? '/auth/complete-profile' :
        '/account';
      router.push(redirectPath);

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
      // console.log('[Auth] 📝 Signing up:', email);
      
      const response = await api.post('/auth/register', {
        email: email.toLowerCase().trim(),
        password: password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Registration failed');
      }

      const { user: userData } = response.data;

      // console.log('[Auth] ✅ Signup successful:', userData.email);

      const userPayload = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role || 'CUSTOMER',
        phone: userData.phone,
        profileCompleted: userData.profileCompleted,
      };

      // Store user in AuthStore (cookies already set by backend)
      setUser(userPayload);

      setMessage('Account created successfully! Welcome to ORA! ✨');

      // Redirect to account page or complete-profile if needed
      const redirectPath =
        (!userData.profileCompleted || !userData.fullName) ? '/auth/complete-profile' :
        '/account';
      router.push(redirectPath);

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

  // ── Shared input style helpers ──
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.42)',
    border: '1px solid rgba(0,0,0,0.06)',
    outline: 'none',
  };
  const onInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.background = 'rgba(255,255,255,0.94)';
    e.target.style.borderColor = '#ec4899';
    e.target.style.boxShadow = '0 0 0 4px rgba(236,72,153,0.07)';
  };
  const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.background = 'rgba(255,255,255,0.42)';
    e.target.style.borderColor = 'rgba(0,0,0,0.06)';
    e.target.style.boxShadow = 'none';
  };

  const ic = 'w-full py-4 rounded-2xl text-sm text-slate-800 placeholder:text-neutral-300 transition-colors duration-200';

  const PrimaryBtn = ({
    disabled,
    children,
    className = '',
  }: {
    disabled?: boolean;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold uppercase tracking-widest text-[11px] rounded-2xl transition-all duration-200 hover:scale-[1.015] active:scale-95 shadow-xl shadow-primary-500/25 disabled:shadow-none flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* ── Blurred jewellery background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 scale-[1.08]"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUyGJKwLAuqU-F7sv2ZRRIS8dNaBp_Bto-5smObPMiD6-TFjrnee0CAEnvWSByMDlYMBhNE8GqvHC66EXVgFlyX6FvlQFi3IlsMD3tD1X2AsL_4KfXVZcRCPAQJI5Yy4HfuqxpeAcjTJxn2wywZ4cmRzZNHO25jIqjgkZG3gDa5uIHg7TEU_j9g3Jn6LT7q_TOBlJV2-6wElB0cGHSEJ-L-4kzB7_VCrp8Ve_84641qHGtFVitDacVZqPqUN06QdZhBQq5PGRwG4OX')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(22px) brightness(0.88) saturate(1.25)',
          }}
        />
        <div className="absolute inset-0 bg-rose-50/25" />
      </div>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-5 py-12 sm:py-20">
        <div className="w-full max-w-md">

          {/* ══════════════════════════════════════
              GLASS CARD
          ══════════════════════════════════════ */}
          <div
            className="rounded-[2.5rem] px-8 py-11 sm:px-12 sm:py-13 text-center relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.76)',
              backdropFilter: 'blur(22px)',
              WebkitBackdropFilter: 'blur(22px)',
              border: '1px solid rgba(212,175,55,0.28)',
              boxShadow:
                '0 32px 80px -16px rgba(236,72,153,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {/* Decorative corner glows */}
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-primary-100/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-secondary-100/15 rounded-full blur-2xl pointer-events-none" />

            {/* ── Logo ── */}
            <div className="mb-10 relative">
              <Link href="/" className="inline-block group">
                <h1
                  className="font-serif text-[2rem] tracking-[0.32em] font-semibold text-slate-700/80 group-hover:text-slate-800 transition-colors duration-300"
                  style={{
                    textShadow:
                      '1px 1px 2px rgba(255,255,255,0.95), -1px -1px 1px rgba(0,0,0,0.05)',
                  }}
                >
                  ORA
                </h1>
                <p className="text-[9px] tracking-[0.52em] uppercase text-slate-400/80 mt-0.5 font-light">
                  Jewellery
                </p>
              </Link>
            </div>

            {/* ── Login / Sign Up Underline Tabs ── */}
            <div className="flex justify-center gap-10 mb-8">
              {(['login', 'signup'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => switchAuthMode(mode)}
                  className={`text-[11px] uppercase tracking-widest font-bold pb-1.5 transition-all duration-200 border-b-2 ${
                    authMode === mode
                      ? 'text-primary-500 border-primary-500'
                      : 'text-neutral-400 border-transparent hover:text-slate-700'
                  }`}
                >
                  {mode === 'login' ? 'Login' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* ── Alert Messages ── */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-2xl bg-red-50/90 border border-red-200/70 flex items-start gap-2.5 text-left">
                <span className="text-red-400 mt-0.5 text-base leading-none">⚠</span>
                <p className="text-red-600 text-xs leading-relaxed">{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-5 px-4 py-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/70 flex items-start gap-2.5 text-left">
                <span className="text-emerald-500 mt-0.5 text-base leading-none">✓</span>
                <p className="text-emerald-700 text-xs leading-relaxed">{message}</p>
              </div>
            )}

            {/* ════════════════════════════════════
                LOGIN — FORM STEP
            ════════════════════════════════════ */}
            {authMode === 'login' && step === 'form' && (
              <>
                {/* Method toggle pills — Email Code first (priority) */}
                <div className="flex p-1 mb-7 rounded-full gap-0.5" style={{ background: 'rgba(0,0,0,0.04)' }}>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('otp')}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-200 ${
                      loginMethod === 'otp'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'text-neutral-500 hover:text-slate-700'
                    }`}
                  >
                    Email Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('password')}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-200 ${
                      loginMethod === 'password'
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'text-neutral-500 hover:text-slate-700'
                    }`}
                  >
                    Password
                  </button>
                </div>

                {/* ── OTP Request Form (Priority) ── */}
                {loginMethod === 'otp' && (
                  <form onSubmit={handleSendOtp} className="space-y-4 text-left">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className={`${ic} pl-11 pr-4`}
                          style={inputStyle}
                          onFocus={onInputFocus}
                          onBlur={onInputBlur}
                          disabled={loading}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <PrimaryBtn disabled={loading || !email.trim()} className="mt-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send Login Code
                        </>
                      )}
                    </PrimaryBtn>

                    <p className="text-center text-[11px] text-neutral-400 pt-1">
                      We&apos;ll email you a secure 8-digit code — no password needed
                    </p>
                  </form>
                )}

                {/* ── Password Login Form ── */}
                {loginMethod === 'password' && (
                  <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          className={`${ic} pl-11 pr-4`}
                          style={inputStyle}
                          onFocus={onInputFocus}
                          onBlur={onInputBlur}
                          disabled={loading}
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center pl-1 pr-0.5">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Password
                        </label>
                        <button
                          type="button"
                          className="text-[10px] text-neutral-400 hover:text-primary-500 transition-colors"
                        >
                          Forgot?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`${ic} pl-11 pr-12`}
                          style={inputStyle}
                          onFocus={onInputFocus}
                          onBlur={onInputBlur}
                          disabled={loading}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <PrimaryBtn disabled={loading || !email.trim() || !password.trim()} className="mt-2">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Logging in…
                        </>
                      ) : (
                        'Login to Account'
                      )}
                    </PrimaryBtn>
                  </form>
                )}
              </>
            )}

            {/* ════════════════════════════════════
                LOGIN — OTP VERIFY STEP
            ════════════════════════════════════ */}
            {authMode === 'login' && step === 'otp-verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center space-y-1 mb-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(236,72,153,0.08)' }}>
                    <Mail className="w-6 h-6 text-primary-500" />
                  </div>
                  <h2 className="text-base font-serif font-semibold text-slate-800 tracking-wide">
                    Check your inbox
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    Code sent to{' '}
                    <span className="text-primary-500 font-medium">{email}</span>
                  </p>
                </div>

                <div className="text-left space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                    8-Digit Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="00000000"
                    maxLength={8}
                    className="w-full px-4 py-5 text-center text-[1.65rem] tracking-[0.45em] rounded-2xl text-slate-800 font-mono placeholder:text-neutral-200 placeholder:text-2xl transition-colors duration-200"
                    style={inputStyle}
                    onFocus={onInputFocus}
                    onBlur={onInputBlur}
                    disabled={loading}
                    autoFocus
                    autoComplete="one-time-code"
                  />
                  <div className="flex justify-between items-center px-1 mt-1">
                    <span className="text-[10px] text-neutral-400">
                      {otpTimer > 0
                        ? `Expires in ${Math.floor(otpTimer / 60)}:${(otpTimer % 60).toString().padStart(2, '0')}`
                        : 'Code expired'}
                    </span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || otpTimer > 0}
                      className="text-[10px] text-primary-500 hover:text-primary-600 disabled:text-neutral-300 font-bold uppercase tracking-wider transition-colors"
                    >
                      Resend
                    </button>
                  </div>
                </div>

                <PrimaryBtn disabled={loading || otp.length < 8}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </PrimaryBtn>

                <button
                  type="button"
                  onClick={resetToForm}
                  className="w-full flex items-center justify-center gap-1.5 text-neutral-400 hover:text-slate-700 text-[11px] font-medium tracking-wider uppercase py-2 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Use a different email
                </button>
              </form>
            )}

            {/* ════════════════════════════════════
                SIGNUP FORM
            ════════════════════════════════════ */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4 text-left">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className={`${ic} pl-11 pr-4`}
                      style={inputStyle}
                      onFocus={onInputFocus}
                      onBlur={onInputBlur}
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className={`${ic} pl-11 pr-4`}
                      style={inputStyle}
                      onFocus={onInputFocus}
                      onBlur={onInputBlur}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                    Phone{' '}
                    <span className="normal-case font-normal text-neutral-300">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9842253984"
                      className={`${ic} pl-11 pr-4`}
                      style={inputStyle}
                      onFocus={onInputFocus}
                      onBlur={onInputBlur}
                      disabled={loading}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className={`${ic} pl-11 pr-12`}
                      style={inputStyle}
                      onFocus={onInputFocus}
                      onBlur={onInputBlur}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 pl-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className={`${ic} pl-11 pr-4`}
                      style={inputStyle}
                      onFocus={onInputFocus}
                      onBlur={onInputBlur}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <PrimaryBtn
                  disabled={
                    loading ||
                    !email.trim() ||
                    !password.trim() ||
                    !fullName.trim() ||
                    !confirmPassword.trim()
                  }
                  className="mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    'Create Account'
                  )}
                </PrimaryBtn>

                <p className="text-center text-[10px] text-neutral-400 pt-1">
                  By signing up, you agree to our{' '}
                  <Link href="/terms" className="text-primary-500 hover:underline">
                    Terms
                  </Link>{' '}
                  &amp;{' '}
                  <Link href="/privacy" className="text-primary-500 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </form>
            )}

            {/* ── Guest Option ── */}
            <div
              className="mt-7 pt-7"
              style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}
            >
              <Link href="/">
                <button
                  type="button"
                  className="w-full py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-neutral-500 hover:text-slate-700 hover:bg-white/80 transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.42)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  Continue as Guest
                </button>
              </Link>
            </div>

            {/* ── Trust Badges ── */}
            <div className="mt-7 flex justify-center gap-7 opacity-25">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <Zap className="w-4 h-4 text-slate-600" />
              <Star className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          {/* end glass card */}

        </div>
      </main>
    </div>
  );
}
