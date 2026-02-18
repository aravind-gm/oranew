'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: isLoading } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      const displayName = user.fullName || 
                          (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
                          user.firstName || '';
      setProfile({
        name: displayName,
        email: user.email || '',
        phone: user.phone || '',
        gender: '',
        dateOfBirth: '',
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/user/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully!');
      } else {
        const data = await response.json();
        const errorData = data.error;
        const errorMsg = typeof errorData === 'string' ? errorData : (errorData?.message || 'Failed to update profile');
        setError(errorMsg);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-800">Account Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile and preferences</p>
          </div>
          <Link 
            href="/account"
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'profile', label: 'Profile', icon: '👤' },
            { id: 'security', label: 'Security', icon: '🔒' },
            { id: 'notifications', label: 'Notifications', icon: '🔔' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 hover:bg-white border border-rose-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-xl p-6 md:p-8 border border-rose-100">
          
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-emerald-700 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-3xl font-serif font-bold shadow-lg">
                  {(profile.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{profile.name || 'Your Name'}</h3>
                  <p className="text-gray-500 text-sm">{profile.email}</p>
                  <button type="button" className="text-rose-600 text-sm font-medium mt-1 hover:text-rose-700">
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                               focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                               outline-none transition-all text-gray-800"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 
                               text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                               focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                               outline-none transition-all text-gray-800"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={profile.gender}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                               focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                               outline-none transition-all text-gray-800"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                               focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                               outline-none transition-all text-gray-800"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-semibold text-white
                             bg-gradient-to-r from-rose-500 to-pink-500
                             hover:from-rose-600 hover:to-pink-600
                             shadow-lg hover:shadow-xl transition-all
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-6 border-2 border-rose-100 rounded-2xl">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">🔐</span> Password
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  You're using passwordless login with OTP. Your account is secured with email verification.
                </p>
                <div className="flex items-center gap-2 text-emerald-600 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Account secured with OTP authentication
                </div>
              </div>

              <div className="p-6 border-2 border-rose-100 rounded-2xl">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">📱</span> Two-Factor Authentication
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Add an extra layer of security to your account.
                </p>
                <button className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-medium hover:bg-rose-100 transition-colors">
                  Enable 2FA
                </button>
              </div>

              <div className="p-6 border-2 border-rose-100 rounded-2xl">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span className="text-xl">🖥️</span> Active Sessions
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage devices where you're logged in.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💻</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">This device</p>
                        <p className="text-xs text-gray-500">Last active: Now</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-lg">Current</span>
                  </div>
                </div>
              </div>

              <div className="p-6 border-2 border-red-100 rounded-2xl bg-red-50/50">
                <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <span className="text-xl">⚠️</span> Danger Zone
                </h3>
                <p className="text-red-600 text-sm mb-4">
                  Permanently delete your account and all associated data.
                </p>
                <button className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <p className="text-gray-600 text-sm">Manage how you receive notifications and updates.</p>
              
              {[
                { id: 'orders', label: 'Order Updates', desc: 'Get notified about your order status', default: true },
                { id: 'offers', label: 'Promotions & Offers', desc: 'Receive exclusive deals and discounts', default: true },
                { id: 'newsletter', label: 'Newsletter', desc: 'Weekly curated picks and trends', default: false },
                { id: 'sms', label: 'SMS Notifications', desc: 'Receive updates via text messages', default: false },
                { id: 'whatsapp', label: 'WhatsApp Updates', desc: 'Get updates on WhatsApp', default: true },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border-2 border-rose-100 rounded-2xl">
                  <div>
                    <h4 className="font-medium text-gray-800">{item.label}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={item.default}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                  </label>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <button className="px-6 py-3 rounded-xl font-semibold text-white
                             bg-gradient-to-r from-rose-500 to-pink-500
                             hover:from-rose-600 hover:to-pink-600
                             shadow-lg hover:shadow-xl transition-all">
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
