'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

interface OrderDetails {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  errorMessage?: string;
}

function FailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retryExpiresAt, setRetryExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for token expiry
  useEffect(() => {
    if (!retryExpiresAt) return;
    const tick = () => {
      const diff = retryExpiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Expired');
        if (countdownRef.current) clearInterval(countdownRef.current);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [retryExpiresAt]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`/payments/${orderId}/status`);
        const data = response.data;
        
        setOrderDetails({
          orderId: data.orderId || orderId,
          orderNumber: data.orderNumber || 'N/A',
          totalAmount: data.totalAmount || 0,
          errorMessage: data.message,
        });
      } catch (err) {
        console.error('[Failed] Error fetching order details:', err);
        setOrderDetails({
          orderId: orderId,
          orderNumber: 'N/A',
          totalAmount: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleRetryPayment = useCallback(async () => {
    if (!orderId) return;
    setRetrying(true);
    setRetryError(null);

    try {
      // Step 1: Get a 15-min retry token
      const tokenRes = await api.post('/payments/retry/token', { orderId });
      const { retryToken, expiresAt } = tokenRes.data;
      setRetryExpiresAt(new Date(expiresAt));

      // Step 2: Exchange token for a new Razorpay order
      const execRes = await api.post('/payments/retry/execute', { retryToken });
      const { razorpayOrderId, key, amount, currency, orderNumber, userEmail, userName } = execRes.data;

      // Step 3: Load Razorpay and open modal
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error('Failed to load payment gateway. Please try again.');

      const rzp = new window.Razorpay({
        key,
        amount,
        currency: currency || 'INR',
        order_id: razorpayOrderId,
        name: 'Ora',
        description: `Order #${orderNumber}`,
        prefill: { email: userEmail, name: userName },
        theme: { color: '#E75480' },
        handler: async (response: Record<string, string>) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            router.push(`/checkout/success?orderId=${orderId}`);
          } catch {
            setRetryError('Payment captured but verification failed. Contact support.');
            setRetrying(false);
          }
        },
        modal: {
          ondismiss: () => setRetrying(false),
        },
      });
      rzp.open();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })
          ?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ||
        (err as Error)?.message ||
        'Something went wrong. Please try again.';
      setRetryError(msg);
      setRetrying(false);
    }
  }, [orderId, router]);

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-lg mx-auto text-center">
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Failed Icon */}
            <div className="mb-8 relative">
              <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mx-auto">
                <div className="w-20 h-20 bg-error/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-3">
              Payment Failed
            </h1>
            <p className="text-lg text-text-muted mb-8">
              We couldn&apos;t process your payment. Don&apos;t worry, no money has been deducted from your account.
            </p>

            {/* Order Details Card */}
            {orderDetails && (
              <div className="bg-background-white rounded-2xl p-6 mb-8 shadow-luxury border border-border">
                <div className="space-y-3">
                  {orderDetails.orderNumber !== 'N/A' && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-muted">Order Reference</p>
                      <p className="font-mono font-medium text-text-primary">
                        {orderDetails.orderNumber}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-muted">Payment Status</p>
                    <span className="px-3 py-1 bg-error/10 text-error text-xs font-medium rounded-full">
                      FAILED
                    </span>
                  </div>
                  {orderDetails.errorMessage && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-text-muted mb-1">Reason</p>
                      <p className="text-sm text-error">{orderDetails.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Common Reasons */}
            <div className="bg-background-white rounded-2xl p-6 mb-8 shadow-luxury text-left">
              <h3 className="font-serif font-semibold text-text-primary mb-4">
                Common reasons for payment failure
              </h3>
              <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-start gap-3">
                  <span className="text-error mt-0.5">•</span>
                  <span>Insufficient funds in your account</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-error mt-0.5">•</span>
                  <span>Card declined by your bank</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-error mt-0.5">•</span>
                  <span>Incorrect card details or OTP</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-error mt-0.5">•</span>
                  <span>Network or connection issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-error mt-0.5">•</span>
                  <span>Transaction timeout</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {retryError && (
                <div className="p-3 bg-error/10 border border-error/30 rounded-xl text-sm text-error text-left mb-1">
                  {retryError}
                </div>
              )}
              {retryExpiresAt && countdown && countdown !== 'Expired' && (
                <p className="text-xs text-text-muted mb-1">
                  Retry session expires in <span className="font-mono font-semibold text-accent">{countdown}</span>
                </p>
              )}
              {orderId ? (
                <button
                  onClick={handleRetryPayment}
                  disabled={retrying}
                  className="btn-primary block w-full py-4 text-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {retrying ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Opening payment…
                    </span>
                  ) : (
                    'Retry Payment'
                  )}
                </button>
              ) : (
                <Link
                  href="/cart"
                  className="btn-primary block w-full py-4 text-center"
                >
                  Return to Cart
                </Link>
              )}
              <Link
                href="/products"
                className="btn-outline block w-full py-4 text-center"
              >
                Continue Shopping
              </Link>
            </div>

            {/* Support Info */}
            <div className="mt-8 p-4 bg-info/5 rounded-xl border border-info/20">
              <p className="text-sm text-text-muted">
                Need help? Contact our support team at{' '}
                <a
                  href="mailto:admin@orashop.in"
                  className="text-[#E75480] hover:underline font-medium"
                >
                  admin@orashop.in
                </a>{' '}
                or call 9842253984, 9095007887, 9342865987
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <FailedContent />
    </Suspense>
  );
}
