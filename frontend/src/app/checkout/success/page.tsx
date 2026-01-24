'use client';

import api from '@/lib/api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface PaymentStatus {
  paymentStatus: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  orderPaymentStatus: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  isConfirmed: boolean;
  isFailed: boolean;
  paymentId: string;
  orderId: string;
  orderNumber: string;
  message: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  // Poll for payment confirmation
  useEffect(() => {
    if (!orderId) return;

    // eslint-disable-next-line prefer-const
    let pollInterval: NodeJS.Timeout | undefined;
    let isMounted = true;
    let attemptCount = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    const pollPaymentStatus = async () => {
      try {
        const response = await api.get(`/payments/${orderId}/status`);
        if (!isMounted) return;

        const status = response.data.success ? response.data : response.data.data;
        setPaymentStatus(status);

        console.log('[Success] Payment status check:', {
          paymentStatus: status.paymentStatus,
          orderPaymentStatus: status.orderPaymentStatus,
          isConfirmed: status.isConfirmed,
          isFailed: status.isFailed,
          message: status.message,
        });

        // CRITICAL: Only show success when BOTH Payment.status AND Order.paymentStatus are CONFIRMED
        // This ensures webhook has processed
        if (status.isConfirmed && !status.isFailed) {
          setLoading(false);
          setShowConfetti(true);
          clearInterval(pollInterval);
        } else if (status.isFailed) {
          // Payment failed
          setLoading(false);
          setError('Payment failed. Please try again or contact support.');
          clearInterval(pollInterval);
        } else if (attemptCount >= maxAttempts) {
          // Stop polling after 5 minutes
          setLoading(false);
          setError('Payment is taking longer than expected. Check your email for confirmation.');
          clearInterval(pollInterval);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('[Success] Error polling payment status:', err);
        
        // Don't stop polling on error, just continue retrying
        if (attemptCount >= maxAttempts) {
          setLoading(false);
          setError('Unable to confirm payment. Check your email for order details.');
          clearInterval(pollInterval);
        }
      }

      attemptCount++;
    };

    // Initial check
    pollPaymentStatus();

    // Poll every 5 seconds
    pollInterval = setInterval(pollPaymentStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [orderId]);

  // Confetti animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-fall"
              style={{
                left: `${(i * 3.3) % 100}%`,
                top: '-20px',
                animationDelay: `${(i * 0.1) % 3}s`,
                animationDuration: '4s',
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#FFD6E8', '#D4AF77', '#FDFBF7', '#F8E8D0'][i % 4],
                  transform: `rotate(${(i * 12) % 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-lg mx-auto text-center relative z-20">
        {loading ? (
          // CRITICAL: Show processing state while waiting for webhook
          <>
            <div className="mb-8">
              <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 rounded-full border-4 border-accent/30 animate-spin" />
                <svg
                  className="w-10 h-10 text-accent animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-3">
              Processing Payment...
            </h1>
            <p className="text-lg text-text-muted mb-8">
              Your payment is being confirmed. This may take a few moments.
            </p>

            <div className="bg-background-white rounded-2xl p-6 mb-8 shadow-luxury border border-border">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">Payment Status</p>
                  <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                    {paymentStatus?.paymentStatus || 'PENDING'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-muted">Order Status</p>
                  <span className="px-3 py-1 bg-info/10 text-info text-xs font-medium rounded-full">
                    {paymentStatus?.orderPaymentStatus || 'PENDING'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-error/10 border border-error/30 rounded-xl mb-8">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <p className="text-sm text-text-muted">
              Do not close this page. You will be redirected shortly.
            </p>
          </>
        ) : paymentStatus?.isConfirmed && paymentStatus?.orderPaymentStatus === 'CONFIRMED' ? (
          // CRITICAL: Only show success after webhook confirmation
          <>
            {/* Success Icon */}
            <div className="mb-8 relative">
              <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 rounded-full border-4 border-success/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-serif font-light text-text-primary mb-2 flex items-center justify-center gap-3">
              <span>Order Complete</span>
              <span className="inline-flex items-center justify-center w-10 h-10 bg-success text-white rounded-full">✓</span>
            </h1>
            <p className="text-lg text-text-muted mb-2">
              Your payment has been verified and order confirmed
            </p>
            <p className="text-sm text-success font-medium mb-8">
              Status: VERIFIED & DONE
            </p>

            {orderId && (
              <div className="bg-background-white rounded-2xl p-6 mb-8 shadow-luxury border border-border">
                <p className="text-sm text-text-muted mb-2">Order Confirmation Number</p>
                <p className="text-xl font-mono font-bold text-accent break-all">{orderId}</p>
                
                {/* Order Status Badges */}
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Payment Verification:</span>
                    <span className="flex items-center gap-2 text-success font-medium">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      VERIFIED
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Order Status:</span>
                    <span className="flex items-center gap-2 text-success font-medium">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      CONFIRMED
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-muted">Overall Status:</span>
                    <span className="px-4 py-1 bg-success text-white text-sm font-bold rounded-full">
                      ✓ DONE
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="bg-background-white rounded-2xl p-6 mb-8 shadow-luxury text-left">
              <h3 className="font-serif font-semibold text-text-primary mb-4">What happens next?</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Order Confirmed</p>
                    <p className="text-sm text-text-muted">We&apos;ve received your order and payment</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-border flex items-center justify-center">
                    <span className="text-text-muted text-sm font-semibold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Processing</p>
                    <p className="text-sm text-text-muted">Your jewellery is being prepared</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-border flex items-center justify-center">
                    <span className="text-text-muted text-sm font-semibold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Shipped</p>
                    <p className="text-sm text-text-muted">On its way to you with care</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-border flex items-center justify-center">
                    <span className="text-text-muted text-sm font-semibold">4</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Delivered</p>
                    <p className="text-sm text-text-muted">Beautifully packaged at your door</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/account"
                className="btn-primary block w-full py-4"
              >
                View Order Status
              </Link>
              <Link
                href="/products"
                className="btn-outline block w-full py-4"
              >
                Continue Shopping
              </Link>
            </div>

            <p className="mt-8 text-sm text-text-muted">
              A confirmation email has been sent to your registered email address.
            </p>
          </>
        ) : (
          // Payment not confirmed yet
          <>
            <div className="mb-8">
              <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-3">
              Payment Pending
            </h1>
            <p className="text-lg text-text-muted mb-8">
              {error || 'Your payment could not be confirmed. Please check your email for more details.'}
            </p>

            <div className="space-y-3">
              <Link
                href="/account"
                className="btn-primary block w-full py-4"
              >
                View Order Status
              </Link>
              <Link
                href="/checkout"
                className="btn-outline block w-full py-4"
              >
                Try Again
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
