'use client';

// Password-based Login Page - Replaces Supabase OTP
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

type LoginStep = 'password-login' | 'admin-login';

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser, user, token, isHydrated } = useAuthStore();

  // Step tracking
  const [step, setStep] = useState<LoginStep>('password-login');
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  // 🔑 CUSTOMER LOGIN WITH PASSWORD
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Login] 📧 Logging in user:', email);

      const response = await api.post('/api/auth/login', {
        email: email.toLowerCase(),
        password,
      });

      if (response.data.success && response.data.token && response.data.user) {
        // Store token and user
        setToken(response.data.token);
        setUser(response.data.user);

        console.log('[Login] ✅ Login successful:', response.data.user.email);
        setMessage('Login successful! Redirecting...');

        // Redirect to account page
        setTimeout(() => {
          router.replace('/account');
        }, 1000);
      } else {
        setError(response.data.error || 'Login failed');
      }
    } catch (err: any) {
      console.error('[Login] ❌ Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 👔 ADMIN LOGIN
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setError('Please enter admin email and password');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('[Login] 👔 Admin login attempt:', adminEmail);

      const response = await api.post('/api/auth/admin-login', {
        email: adminEmail.toLowerCase(),
        password: adminPassword,
      });

      if (response.data.success && response.data.token && response.data.user) {
        // Store token and user
        setToken(response.data.token);
        setUser(response.data.user);

        console.log('[Login] ✅ Admin login successful:', response.data.user.email);
        setMessage('Admin login successful! Redirecting...');

        // Redirect to admin panel
        setTimeout(() => {
          router.replace('/admin');
        }, 1000);
      } else {
        setError(response.data.error || 'Admin login failed');
      }
    } catch (err: any) {
      console.error('[Login] ❌ Admin login error:', err);
      setError(err.response?.data?.error || 'Admin login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900">ORA</h1>
          <h2 className="mt-2 text-2xl font-bold text-neutral-800">Customer Login</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in with email and password</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="text-sm text-green-700">{message}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-white rounded-lg shadow p-8 space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Logging in...' : 'Login'}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link href="/auth/forgot-password" className="text-sm text-amber-600 hover:text-amber-700">
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/auth/register" className="font-medium text-amber-600 hover:text-amber-700">
              Sign up here
            </Link>
          </p>
        </div>

        {/* Admin Login Shortcut (Dev Only) */}
        {showAdminForm && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow p-6 space-y-4">
            <h3 className="font-bold text-yellow-800">🔐 Admin Login (Dev Only)</h3>
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Admin email"
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm"
              />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Admin Login'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
