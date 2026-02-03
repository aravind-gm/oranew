'use client';

import api from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('[Forgot Password] 📧 Sending reset email to:', email);

      const response = await api.post('/api/auth/forgot-password', { 
        email: email.toLowerCase() 
      });

      if (response.data.success) {
        setMessage(response.data.message || 'If an account with that email exists, a password reset link has been sent.');
        setEmail('');
        setSubmitted(true);
        console.log('[Forgot Password] ✅ Reset email sent');
      } else {
        setError(response.data.error || 'Failed to send reset email');
      }
    } catch (err: any) {
      console.error('[Forgot Password] ❌ Error:', err);
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
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
          <h2 className="mt-2 text-2xl font-bold text-neutral-800">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">We'll send you a link to reset your password</p>
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
            <div>
              <p className="text-sm text-green-700 font-semibold mb-2">Check your email</p>
              <p className="text-sm text-green-700">{message}</p>
              <p className="text-xs text-green-600 mt-2">Check your spam folder if you don't see the email.</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
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
              <p className="mt-2 text-xs text-gray-500">
                Enter the email address associated with your account
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center space-y-4">
            <p className="text-gray-700">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-600">
              The link will expire in 15 minutes. Click the link in your email to reset your password.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setMessage('');
                setError('');
              }}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Send to a different email
            </button>
          </div>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
