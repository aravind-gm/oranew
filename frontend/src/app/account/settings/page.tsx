'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

interface FormErrors {
  [key: string]: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { token, user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || user?.firstName || '',
    phone: user?.phone || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
  }, [token, router]);

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    // Validation
    if (!profileForm.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!profileForm.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(profileForm.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/auth/profile', {
        fullName: profileForm.fullName,
        phone: profileForm.phone,
      });

      if (response.data.success) {
        setUser(response.data.data);
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to update profile';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    // Validation
    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      if (response.data.success) {
        setSuccessMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to change password';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete('/auth/account');
      if (response.data.success) {
        const { logout } = useAuthStore.getState();
        logout();
        router.push('/');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to delete account';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  if (!token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/30 via-background-white to-accent/10 py-12">
        <div className="container-luxury">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary">
                Account Settings
              </h1>
              <p className="text-text-muted mt-2">Manage your profile and preferences</p>
            </div>
            <Link
              href="/account"
              className="hidden md:flex items-center gap-2 px-4 py-2 border border-primary/30 text-primary rounded-xl hover:bg-primary/10 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="container-luxury py-10">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <div className="bg-background-white rounded-2xl shadow-luxury p-6 sticky top-32">
              <h2 className="font-serif font-semibold text-text-primary mb-4">Quick Links</h2>
              <nav className="space-y-1">
                <Link
                  href="/account"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  My Orders
                </Link>
                <Link
                  href="/account/addresses"
                  className="flex items-center gap-3 p-3 hover:bg-primary/5 text-text-primary rounded-xl transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Addresses
                </Link>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="w-full flex items-center gap-3 p-3 bg-primary/10 text-accent rounded-xl font-medium transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="bg-background-white rounded-2xl shadow-luxury overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex">
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setErrors({});
                    }}
                    className={`flex-1 px-6 py-4 font-semibold transition ${
                      activeTab === 'profile'
                        ? 'border-b-2 border-accent text-accent'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Profile Information
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('password');
                      setErrors({});
                    }}
                    className={`flex-1 px-6 py-4 font-semibold transition ${
                      activeTab === 'password'
                        ? 'border-b-2 border-accent text-accent'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="p-8">
                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 p-4 bg-success/10 border border-success/30 text-success rounded-xl">
                    ✓ {successMessage}
                  </div>
                )}

                {/* General Error */}
                {errors.general && (
                  <div className="mb-6 p-4 bg-error/10 border border-error/30 text-error rounded-xl">
                    ✕ {errors.general}
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Email (Read-only) */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-text-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                      </div>

                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileForm.fullName}
                          onChange={(e) => handleProfileChange('fullName', e.target.value)}
                          placeholder="Enter your full name"
                          className={`w-full px-4 py-3 border rounded-xl transition focus:outline-none focus:ring-2 focus:ring-accent ${
                            errors.fullName ? 'border-error' : 'border-border'
                          }`}
                        />
                        {errors.fullName && (
                          <p className="text-xs text-error mt-1">{errors.fullName}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            handleProfileChange('phone', e.target.value.replace(/\D/g, ''))
                          }
                          placeholder="10-digit mobile number"
                          maxLength={10}
                          className={`w-full px-4 py-3 border rounded-xl transition focus:outline-none focus:ring-2 focus:ring-accent ${
                            errors.phone ? 'border-error' : 'border-border'
                          }`}
                        />
                        {errors.phone && (
                          <p className="text-xs text-error mt-1">{errors.phone}</p>
                        )}
                      </div>

                      {/* Member Since */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Member Since
                        </label>
                        <input
                          type="text"
                          value={
                            user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : 'N/A'
                          }
                          disabled
                          className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-text-muted cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 disabled:opacity-50 transition"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          handlePasswordChange('currentPassword', e.target.value)
                        }
                        placeholder="Enter your current password"
                        className={`w-full px-4 py-3 border rounded-xl transition focus:outline-none focus:ring-2 focus:ring-accent ${
                          errors.currentPassword ? 'border-error' : 'border-border'
                        }`}
                      />
                      {errors.currentPassword && (
                        <p className="text-xs text-error mt-1">{errors.currentPassword}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                        placeholder="Enter your new password"
                        className={`w-full px-4 py-3 border rounded-xl transition focus:outline-none focus:ring-2 focus:ring-accent ${
                          errors.newPassword ? 'border-error' : 'border-border'
                        }`}
                      />
                      {errors.newPassword && (
                        <p className="text-xs text-error mt-1">{errors.newPassword}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          handlePasswordChange('confirmPassword', e.target.value)
                        }
                        placeholder="Confirm your new password"
                        className={`w-full px-4 py-3 border rounded-xl transition focus:outline-none focus:ring-2 focus:ring-accent ${
                          errors.confirmPassword ? 'border-error' : 'border-border'
                        }`}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-error mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent/90 disabled:opacity-50 transition"
                    >
                      {loading ? 'Updating...' : 'Change Password'}
                    </button>
                  </form>
                )}

                {/* Danger Zone */}
                <div className="mt-12 pt-8 border-t border-error/30">
                  <h3 className="text-lg font-serif font-semibold text-error mb-4">Danger Zone</h3>
                  <p className="text-text-muted text-sm mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="px-6 py-3 bg-error/10 border border-error/50 text-error rounded-xl font-semibold hover:bg-error/20 disabled:opacity-50 transition"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
