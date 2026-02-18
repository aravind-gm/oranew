'use client';

// ORA Jewellery - Complete Profile Page
// Shown after first OTP login for new users

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Phone, User, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingProfile, setCheckingProfile] = useState(true);
  const hasRedirectedRef = useRef(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');

  // 🔒 CHECK AUTH STATUS - wait for auth loading before deciding
  useEffect(() => {
    if (authLoading) return; // wait for fetchUser() to complete

    // No user at all = not authenticated
    if (!user) {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace('/auth/login');
      }
      return;
    }

    // Admin bypass
    if (user.role === 'ADMIN') {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace('/admin');
      }
      return;
    }

    // Pre-fill form with user data
    if (user.fullName) setFullName(user.fullName);
    if (user.phone) setPhone(user.phone);

    setCheckingProfile(false);
  }, [user, authLoading, router]);

  const validatePhone = (phoneValue: string) => {
    const digits = phoneValue.replace(/\D/g, '');
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

      // console.log('[Profile] 📝 Updating profile for:', user?.email);

      // Call backend - CORRECT ENDPOINT: PUT /user/complete-profile (singular)
      const { data: updateData } = await api.put('/user/complete-profile', {
        fullName: fullName.trim(),
        phone: phone.replace(/\D/g, ''),
        gender: gender || undefined,
      });

      if (!updateData?.success) {
        throw new Error(updateData?.error || 'Failed to save profile');
      }

      // console.log('[Profile] ✅ Profile updated successfully');

      // Update local auth store
      setUser({
        ...user!,
        fullName: fullName.trim(),
        phone: phone.replace(/\D/g, ''),
        profileCompleted: true,
      });

      // Redirect to account page
      router.replace('/account');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      console.error('[Profile Submit Error]', err);
      
      let errorMessage = 'Failed to save profile. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Glassmorphic Card */}
      <div className="w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-rose-600 via-pink-500 to-amber-500 bg-clip-text text-transparent tracking-wide">
                ORA
              </h1>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-2xl font-serif font-medium text-gray-800 mb-2">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 text-sm">
              Just a few details to personalize your experience
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-4 bg-white/60 backdrop-blur border border-gray-200 rounded-2xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all text-gray-800 placeholder:text-gray-400"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">
                {phone.length === 0 
                  ? 'Required for order updates' 
                  : phone.length < 10 
                    ? `${10 - phone.length} more digits needed`
                    : '✓ Valid'
                }
              </p>
            </div>

            {/* Gender (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-gray-400">(optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Female', 'Male', 'Other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(gender === option ? '' : option)}
                    disabled={loading}
                    className={`py-3 px-4 rounded-xl border transition-all text-sm font-medium ${
                      gender === option
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-transparent shadow-md'
                        : 'bg-white/60 text-gray-600 border-gray-200 hover:border-rose-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !fullName.trim() || !validatePhone(phone)}
              className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:via-pink-600 hover:to-amber-600 disabled:from-gray-300 disabled:via-gray-300 disabled:to-gray-300 text-white font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:shadow-none mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Complete Profile
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Email Display */}
          <div className="mt-6 pt-4 border-t border-gray-200/50">
            <p className="text-center text-sm text-gray-500">
              Logged in as <span className="font-medium text-gray-700">{user?.email}</span>
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
