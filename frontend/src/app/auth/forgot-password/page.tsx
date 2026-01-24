'use client';

import api from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        setMessage('Password reset email sent. Check your inbox.');
        setEmail('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
        <p className="text-gray-600 text-sm mb-6">Enter your email and we'll send a password reset link.</p>

        {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
