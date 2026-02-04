'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user: authUser, isLoading: authLoading, updateProfile } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if already authenticated and profile completed
  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        router.replace('/auth/login');
      } else if (authUser.profileCompleted && authUser.fullName) {
        router.replace('/account');
      }
    }
  }, [authLoading, authUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !phone.trim()) {
      setError('Full name and phone number are required');
      return;
    }

    if (phone.length !== 10) {
      setError('Phone number must be 10 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/user/complete-profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone,
            gender: gender || null,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess('✨ Profile completed successfully!');
        
        // Update local auth state
        if (updateProfile) {
          updateProfile({
            ...authUser,
            fullName,
            phone,
            profileCompleted: true,
          });
        }

        setTimeout(() => {
          router.replace('/account');
        }, 1500);
      } else {
        const errorMessage = typeof data.error === 'string' ? data.error : 
                            typeof data.message === 'string' ? data.message : 
                            'Failed to complete profile';
        setError(errorMessage);
      }
    } catch (err: any) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-rose-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full mb-4">
              <span className="text-white text-2xl">✨</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Help us personalize your experience</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <p className="text-green-700 text-sm font-medium">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl border-2 border-rose-200 bg-white/90 
                           focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                           outline-none transition-all text-gray-800 placeholder-gray-400"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-4 py-3 rounded-l-xl border-2 border-r-0 border-rose-200 bg-rose-50 text-gray-600 text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 px-4 py-3 rounded-r-xl border-2 border-rose-200 bg-white/90 
                             focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                             outline-none transition-all text-gray-800 placeholder-gray-400"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Gender (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Female', 'Male', 'Other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setGender(gender === option ? '' : option)}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all border-2 ${
                      gender === option
                        ? 'border-rose-400 bg-rose-50 text-rose-700'
                        : 'border-rose-200 bg-white/90 text-gray-700 hover:border-rose-300'
                    } disabled:opacity-50`}
                    disabled={loading}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !fullName.trim() || !phone.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-400 to-orange-400 
                         hover:from-rose-500 hover:to-orange-500 disabled:opacity-50
                         text-white font-semibold rounded-xl transition-all
                         shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span>✨</span> Complete Profile
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Your information is secure and will only be used to personalize your experience.
          </p>
        </div>
      </div>
    </div>
  );
}
