'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Phone, User, ArrowRight, Loader2, AlertCircle, Mail } from 'lucide-react';
import api from '@/lib/api';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, isHydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);
  const hasRedirectedRef = useRef(false);

  // Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // 🔒 CHECK AUTH AND ADMIN STATUS
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for hydration
        if (!isHydrated) {
          console.log('[Profile] ⏳ Waiting for auth hydration');
          return;
        }

        // No auth = redirect to login
        if (!user || !token) {
          console.log('[Profile] ❌ Not authenticated, redirecting to login');
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            router.replace('/auth/login');
          }
          return;
        }

        console.log('[Profile] ✅ User verified:', user.email);
        
        // 🛑 ADMIN BYPASS - NEVER SHOW PROFILE FORM FOR ADMIN
        if (user.role === 'ADMIN' || user.role === 'admin') {
          console.log('[Profile] 🛡️ Admin detected, skipping profile completion');
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            router.replace('/admin');
          }
          return;
        }

        // Pre-fill form with user data
        if (user.fullName) {
          setFullName(user.fullName);
        }
        if (user.phone) {
          setPhone(user.phone);
        }

        console.log('[Profile] ✅ Auth check passed, showing profile form');
        setCheckingProfile(false);
      } catch (err: any) {
        console.error('[Profile] ❌ Auth check error:', err);
        if (!hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          router.replace('/auth/login');
        }
        return;
      }
    };

    checkAuth();
  }, [isHydrated, user, token, router]);

  const validatePhone = (phoneValue: string) => {
    // Remove all non-digits
    const digits = phoneValue.replace(/\D/g, '');
    // Valid Indian phone: 10 digits
    return digits.length === 10;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!fullName.trim()) {
        throw new Error('Full name is required');
      }

      if (fullName.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters');
      }

      if (!phone || !validatePhone(phone)) {
        throw new Error('Please enter a valid 10-digit phone number');
      }

      console.log('[Profile] 📝 Updating profile for:', user?.email);
      console.log('[Profile] 📝 Data:', { fullName: fullName.trim(), phone: phone.replace(/\D/g, '') });

      // Call backend to update profile
      const { data: updateData, status } = await api.post('/auth/profile', {
        fullName: fullName.trim(),
        phone: phone.replace(/\D/g, ''),
      });

      if (status !== 200 || !updateData?.success) {
        throw new Error('Failed to save profile');
      }

      console.log('[Profile] ✅ Profile updated successfully');

      // Redirect to account page
      console.log('[Profile] 🎉 Profile complete, redirecting to /account');
      router.replace('/account');
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString?.() || 'Failed to save profile';
      setError(errorMessage);
      console.error('[Profile Submit Error]', {
        error: err,
        message: err?.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-muted">Preparing profile setup...</p>
          <p className="text-xs text-text-muted mt-4">This should only take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#FFF5F7] to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-3xl font-serif font-bold text-accent tracking-wide">ORA</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h2 className="text-2xl font-serif font-medium text-text-primary">
              Complete Your Profile
            </h2>
            <p className="text-text-muted text-sm">
              Just a couple of details to get started
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary ml-1">Full Name</label>
              <div className="relative group">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all pl-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Your full name"
                  required
                />
                <User className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-accent" />
              </div>
              <p className="text-xs text-text-muted ml-1">As you'd like it displayed</p>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary ml-1">Phone Number</label>
              <div className="relative group">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    // Allow only digits and format as user types
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all pl-12 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="10-digit phone number"
                  maxLength={10}
                  required
                />
                <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-accent" />
              </div>
              <p className="text-xs text-text-muted ml-1">
                {phone.length === 0 ? 'Enter 10 digits' : phone.length < 10 ? `${10 - phone.length} more digits` : '✅ Valid'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !fullName.trim() ||
                fullName.trim().length < 2 ||
                !phone ||
                !validatePhone(phone)
              }
              className="w-full bg-accent text-white py-3 rounded-xl font-medium text-sm hover:bg-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group shadow-lg shadow-accent/20 mt-6"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Continue to ORA <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Email Display */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <Mail className="w-4 h-4" />
              <span>Logged in as: <strong>{user?.email}</strong></span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-xs text-text-muted">
          <div className="space-y-1">
            <div className="text-lg">🔒</div>
            <p>Secure</p>
          </div>
          <div className="space-y-1">
            <div className="text-lg">⚡</div>
            <p>Instant</p>
          </div>
          <div className="space-y-1">
            <div className="text-lg">✨</div>
            <p>Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
}
