// ============================================
// FRONTEND RAZORPAY PAYMENT HANDLER
// ============================================
// Location: frontend/src/app/checkout/payment/page.tsx
// This is the success handler for Razorpay checkout modal

import type { AxiosInstance } from 'axios';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Razorpay Response Type
 */
type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

/**
 * Payment Handler Context - passed from component
 */
type PaymentHandlerContext = {
  api: AxiosInstance;
  router: AppRouterInstance;
  orderId: string;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  orderData?: {
    totalAmount?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?: any[];
  };
};

/**
 * Handle successful Razorpay payment
 * 
 * FLOW:
 * 1. User completes payment in Razorpay modal
 * 2. Razorpay calls this handler with payment details
 * 3. We POST to /api/payments/verify to verify signature
 * 4. Backend confirms payment in database
 * 5. Frontend shows success page ONLY after verify succeeds
 * 
 * CRITICAL: DO NOT mark order as paid until verify returns success
 */
const createHandlePaymentSuccess = (context: PaymentHandlerContext) => {
  return async (response: RazorpayResponse): Promise<void> => {
    const { api, router, orderId, setLoading, setError } = context;
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;

  console.log('[Payment] Success callback received from Razorpay');
  console.log('[Payment] Response:', {
    razorpay_payment_id: razorpay_payment_id.substring(0, 10) + '...',
    razorpay_order_id: razorpay_order_id.substring(0, 10) + '...',
    razorpay_signature: razorpay_signature.substring(0, 10) + '...',
  });

  try {
    setLoading(true);
    setError('');

    // ────────────────────────────────────────────
    // STEP 1: Verify signature on backend
    // ────────────────────────────────────────────
    console.log('[Payment] Verifying signature with backend...');

    const verifyResponse = await api.post('/payments/verify', {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    });

    console.log('[Payment] Verify response:', verifyResponse.status, verifyResponse.data);

    if (!verifyResponse.data.success) {
      throw new Error('Payment verification failed');
    }

    console.log('[Payment] ✓ Payment verified successfully');

    // ────────────────────────────────────────────
    // STEP 2: Redirect to success page
    // ────────────────────────────────────────────
    console.log('[Payment] Redirecting to success page...');
    
    // Wait a moment to ensure database is updated
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    router.push(`/checkout/success?orderId=${orderId}`);
  } catch (err: unknown) {
    console.error('[Payment] Payment verification failed:', err);
    
    const errorMessage = 
      err instanceof Error ? err.message : 'Payment verification failed. Please contact support.';
    
    setError(errorMessage);
    setLoading(false);
  }
  };
};

// ============================================
// COMPLETE RAZORPAY OPTIONS
// ============================================
/**
 * This should be called in your handlePayment function
 * after getting the payment response from /api/payments/create
 */
const createDisplayRazorpayCheckout = (context: PaymentHandlerContext) => {
  return async (
    razorpayOrderId: string,
    razorpayKeyId: string,
    amount: number,
    customerEmail: string,
    customerName: string,
    customerPhone: string
  ): Promise<void> => {
    const { orderId } = context;
    const handlePaymentSuccess = createHandlePaymentSuccess(context);
    // Ensure Razorpay script is loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).Razorpay) {
      throw new Error('Razorpay script not loaded');
    }

  const options = {
    // ────── PAYMENT DETAILS ──────
    key: razorpayKeyId, // Razorpay key ID
    amount: Math.round(amount * 100), // Amount in paise
    currency: 'INR',
    order_id: razorpayOrderId, // Razorpay order ID from backend
    
    // ────── MERCHANT INFO ──────
    name: 'ORA Jewellery',
    description: `Order #${orderId}`,
    
    // ────── CUSTOMER INFO ──────
    prefill: {
      name: customerName,
      email: customerEmail,
      contact: customerPhone,
    },
    
    // ────── SUCCESS CALLBACK ──────
    // Called when user completes payment successfully
    handler: async (response: RazorpayResponse) => {
      console.log('[Razorpay] Success callback triggered');
      await handlePaymentSuccess(response);
    },
    
    // ────── MODAL OPTIONS ──────
    modal: {
      // Called when user dismisses modal (Escape key or close button)
      ondismiss: () => {
        console.log('[Razorpay] User dismissed payment modal');
        context.setLoading(false);
        context.setError('Payment cancelled. Please try again.');
      },
    },
    
    // ────── THEME ──────
    theme: {
      color: '#D4AF77', // Gold color for jewellery
    },
    
    // ────── ADDITIONAL OPTIONS ──────
    notes: {
      orderId: orderId,
      customerEmail: customerEmail,
    },
    
    // ────── TIMEOUT ──────
    timeout: 600, // 10 minutes
  };

  // Open Razorpay checkout modal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const razorpayWindow = new (window as any).Razorpay(options);
    razorpayWindow.open();
  };
};

// ============================================
// INTEGRATION IN handlePayment FUNCTION
// ============================================
/**
 * This should replace or be integrated into your existing handlePayment function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createHandlePayment = (context: PaymentHandlerContext, orderData: any) => {
  return async (): Promise<void> => {
    const { api, setLoading, setError, orderId } = context;
    
    setLoading(true);
    setError('');

  try {
    if (!orderId) throw new Error('Order ID not found');

    console.log('[Payment] Starting payment flow...');

    // STEP 1: Create Razorpay order on backend
    const paymentResponse = await api.post('/payments/create', { orderId });

    if (!paymentResponse.data.success) {
      throw new Error(paymentResponse.data.error?.message || 'Failed to create payment');
    }

    const {
      razorpayOrderId,
      razorpayKeyId,
      customer,
    } = paymentResponse.data;

    const amount = orderData?.totalAmount || 0;

    console.log('[Payment] Razorpay order created:', razorpayOrderId);

    // STEP 2: Display Razorpay checkout modal
    const displayRazorpayCheckout = createDisplayRazorpayCheckout(context);
    await displayRazorpayCheckout(
      razorpayOrderId,
      razorpayKeyId,
      amount,
      customer.email,
      customer.name,
      customer.phone
    );

    // STEP 3: Success handler is called by Razorpay on payment success
    // No code needed here - Razorpay will call handlePaymentSuccess
  } catch (err: unknown) {
    console.error('[Payment] Error:', err);
    const errorMessage =
      err instanceof Error ? err.message : 'An error occurred. Please try again.';
    setError(errorMessage);
    setLoading(false);
  }
  };
};

/**
 * ============================================
 * EXPORT HELPER FUNCTIONS AND TYPES
 * ============================================
 * 
 * Usage in your payment component:
 * 
 * ```typescript
 * import { 
 *   createHandlePayment, 
 *   createDisplayRazorpayCheckout,
 *   createHandlePaymentSuccess,
 *   type PaymentHandlerContext,
 *   type RazorpayResponse
 * } from './razorpay-handler';
 * 
 * const context: PaymentHandlerContext = { ... };
 * const handlePayment = createHandlePayment(context, orderData);
 * await handlePayment();
 * ```
 */

export { createDisplayRazorpayCheckout, createHandlePayment, createHandlePaymentSuccess };
export type { PaymentHandlerContext, RazorpayResponse };

