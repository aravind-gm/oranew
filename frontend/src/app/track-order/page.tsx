'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!orderId || !email) {
      setError('Please fill in all fields');
      return;
    }

    // For logged-in users, redirect to account orders
    setLoading(true);
    setTimeout(() => {
      window.location.href = '/account/orders';
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container-luxury max-w-2xl">
        <Link href="/" className="text-accent hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-background-white rounded-2xl shadow-luxury p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-serif font-bold text-text-primary mb-2">
              Track Your Order
            </h1>
            <p className="text-text-secondary">
              Enter your order details to track your delivery
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl">
              <p className="text-error text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ORD-XXXXXXXX"
                className="input-luxury"
                required
              />
              <p className="text-xs text-text-muted mt-1">
                Found in your order confirmation email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-luxury"
                required
              />
              <p className="text-xs text-text-muted mt-1">
                Email used when placing the order
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Tracking...
                </span>
              ) : (
                'Track Order'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-center text-text-muted text-sm mb-4">
              Already have an account?
            </p>
            <Link
              href="/account/orders"
              className="block text-center text-accent hover:underline font-medium"
            >
              View all orders in your account →
            </Link>
          </div>

          <div className="mt-8 bg-primary/10 p-6 rounded-xl">
            <h3 className="font-semibold text-text-primary mb-3">Need Help?</h3>
            <p className="text-sm text-text-secondary mb-4">
              Contact our customer support team for assistance with your order.
            </p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:support@orajewellery.com"
                  className="text-accent hover:underline"
                >
                  support@orajewellery.com
                </a>
              </p>
              <p>
                <strong>Phone:</strong> +91-XXXX-XXXXXX
              </p>
              <p>
                <strong>Hours:</strong> Mon-Sat, 10:00 AM - 6:00 PM IST
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
