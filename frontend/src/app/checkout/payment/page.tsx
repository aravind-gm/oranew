'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayKeyResponse {
  keyId: string;
}

interface OrderData {
  id: string;
  totalAmount: number;
  items?: Array<{ product?: { name: string }; quantity: number; unitPrice: number }>;
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { token: storeToken, isHydrated } = useAuthStore();
  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const fetchOrderData = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrderData(response.data.data || response.data.order);
    } catch (err: unknown) {
      setError('Failed to load order. Please try again.');
      console.error('Error fetching order:', err);
    }
  }, [orderId]);

  // Check auth and load Razorpay script on mount
  useEffect(() => {
    // Wait for hydration before proceeding
    if (!isHydrated) return;

    // Ensure token is hydrated from localStorage
    if (!token && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('ora_token');
      if (storedToken) {
        setToken(storedToken);
      }
    }

    // Use store token if available
    if (storeToken) {
      setToken(storeToken);
    }

    // If no token after attempting to get from both sources, redirect to login
    const currentToken = token || storeToken || (typeof window !== 'undefined' ? localStorage.getItem('ora_token') : null);
    if (!currentToken) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }

    if (!orderId) {
      router.push('/checkout');
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Fetch order data
    void fetchOrderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]); // Wait for hydration

  const handlePayment = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      if (!orderId) throw new Error('Order ID not found');

      console.log('[Payment] Starting payment with orderId:', orderId);

      // IMPORTANT: DO NOT check token here. Let Axios handle it.
      // - Request interceptor will attach token automatically
      // - If token missing: Axios 401 interceptor will redirect to login
      // - If token present but invalid: Axios will reject (not redirect)
      // This prevents duplicate auth logic and redirect conflicts.

      // Step 1: Create Razorpay payment order
      const paymentResponse = await api.post('/payments/create', {
        orderId,
      });

      console.log('[Payment] Payment response:', paymentResponse.status, paymentResponse.data);

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.error?.message || 'Failed to create payment');
      }

      const { razorpayOrderId, razorpayKeyId } = paymentResponse.data;

      // Step 2: Get Razorpay Key ID if not provided
      let keyId = razorpayKeyId;
      if (!keyId) {
        try {
          const keyResponse = await api.get('/payments/razorpay-key');
          keyId = (keyResponse.data as RazorpayKeyResponse).keyId;
        } catch {
          console.warn('Failed to get Razorpay key from API, using env var');
          keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        }
      }

      if (!keyId) {
        throw new Error('Razorpay key not configured');
      }

      // Step 3: Open Razorpay checkout
      const amount = orderData?.totalAmount || 0;
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency: 'INR',
        order_id: razorpayOrderId,
        name: 'ORA Jewellery',
        description: `Order #${orderId}`,
        handler: async (response: RazorpayResponse) => {
          await handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setError('Payment cancelled. Please try again.');
          },
        },
        theme: {
          color: '#D4AF77',
        },
      };

      if (!window.Razorpay) {
        throw new Error('Razorpay not loaded');
      }

      console.log('[Payment] Opening Razorpay modal');
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (err: unknown) {
      console.error('[Payment Error]', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
      // Note: 401 with no token will be handled by Axios interceptor (already redirects)
      // 401 with token present means token is invalid/expired - show error
      // Other errors are business logic errors
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse): Promise<void> => {
    try {
      // CRITICAL: Verify payment signature with backend
      const verifyResponse = await api.post('/payments/verify', {
        orderId,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (!verifyResponse.data.success) {
        throw new Error('Payment verification failed');
      }

      // CRITICAL: Do NOT assume payment is complete yet
      // Redirect to success page which will poll for webhook confirmation
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Payment verification failed. Please contact support.';
      setError(errorMessage);
      console.error('Verification error:', err);
    }
  };

  if (!token || !orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 animate-spin mx-auto mb-4 text-accent" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-text-muted">Loading payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-background-white border-b border-border">
        <div className="container-luxury py-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-muted">Checkout</span>
            <span className="text-text-muted">/</span>
            <span className="text-text-primary font-medium">Payment</span>
          </div>
        </div>
      </div>

      <div className="container-luxury py-10">
        <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-2">Secure Payment</h1>
        <p className="text-text-muted mb-8">Complete your purchase with Razorpay</p>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl">
            <p className="text-error flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-background-white rounded-2xl shadow-luxury p-6 md:p-8">
              <h2 className="text-xl font-serif font-semibold text-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Payment Details
              </h2>

              <div className="mb-6 p-4 bg-accent/5 rounded-xl border border-accent/20">
                <p className="text-sm text-text-muted mb-1">You will be redirected to Razorpay</p>
                <p className="text-lg font-serif font-bold text-accent">₹{orderData?.totalAmount?.toLocaleString() || 'Loading...'}</p>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading || !orderData}
                className="btn-primary w-full py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay with Razorpay
                  </span>
                )}
              </button>

              {/* Security Info */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-start gap-3 text-sm">
                  <svg className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-text-primary">Secure Payment</p>
                    <p className="text-text-muted">Your payment is secured with 256-bit SSL encryption and PCI DSS compliance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-background-white rounded-2xl shadow-luxury p-6 sticky top-32">
              <h2 className="text-xl font-serif font-semibold text-text-primary mb-6">Order Summary</h2>

              {orderData?.items && (
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {orderData.items.map((item: typeof orderData.items[number], idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-text-muted">{item.product?.name} x{item.quantity}</span>
                      <span className="text-text-primary font-medium">₹{(item.unitPrice * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text-primary">₹{(orderData?.totalAmount)?.toLocaleString() || '...'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Shipping</span>
                  <span className="text-success font-medium">Free</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-lg font-serif font-bold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent">₹{(orderData?.totalAmount)?.toLocaleString() || '...'}</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-text-muted text-center">
                Powered by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
