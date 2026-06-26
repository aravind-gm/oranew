'use client';

import api from '@/lib/api';
import { trackPurchase } from '@/lib/analytics';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import OrderSuccessAnimation from '@/components/order-success/OrderSuccessAnimation';

// ============================================================================
// TYPES
// ============================================================================

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product?: { id: string; name: string; category?: { name: string } };
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  items: OrderItem[];
}

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

// ============================================================================
// CONFETTI COLORS (ORA brand palette)
// ============================================================================
const CONFETTI_COLORS = ['#FFD6E8', '#D4AF77', '#FDFBF7', '#F8E8D0', '#E8B4CB', '#C9975B'];
const CONFETTI_SHAPES = ['square', 'circle', 'triangle'] as const;

// ============================================================================
// ANIMATED CHECKMARK (compact)
// ============================================================================

function AnimatedCheckmark() {
  return (
    <div className="relative w-14 h-14 mx-auto mb-3">
      <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping" style={{ animationDuration: '2s' }} />
      <div className="absolute inset-2 rounded-full bg-emerald-500 flex items-center justify-center">
        <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" className="animate-draw-check" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// PREMIUM CONFETTI
// ============================================================================

function PremiumConfetti({ count = 40 }: { count?: number }) {
  // Respect prefers-reduced-motion
  const [reduceMotion, setReduceMotion] = useState(false);
  
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (reduceMotion) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const shape = CONFETTI_SHAPES[i % CONFETTI_SHAPES.length];
        const left = `${(i * 2.5) % 100}%`;
        const delay = `${(i * 0.08) % 2.5}s`;
        const duration = `${3 + (i % 3)}s`;
        const size = 6 + (i % 8);
        const rotation = (i * 37) % 360;

        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left,
              top: '-20px',
              animationDelay: delay,
              animationDuration: duration,
            }}
          >
            {shape === 'square' && (
              <div
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  transform: `rotate(${rotation}deg)`,
                  borderRadius: 2,
                }}
              />
            )}
            {shape === 'circle' && (
              <div
                style={{
                  width: size,
                  height: size,
                  backgroundColor: color,
                  borderRadius: '50%',
                }}
              />
            )}
            {shape === 'triangle' && (
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${size / 2}px solid transparent`,
                  borderRight: `${size / 2}px solid transparent`,
                  borderBottom: `${size}px solid ${color}`,
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// POST-CHECKOUT UPSELL — Complete Your Look
// Shows max 2 related/featured products. No urgency, no timers.
// ============================================================================

interface UpsellProduct {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  images: Array<{ imageUrl: string; isPrimary: boolean }>;
}

function PostCheckoutUpsell({ categoryId }: { categoryId?: string }) {
  const [products, setProducts] = useState<UpsellProduct[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const params: Record<string, string | number> = { limit: 3 };
        if (categoryId) params.category = categoryId;
        const res = await api.get('/products', { params });
        const all: UpsellProduct[] = res.data?.data?.products ?? res.data?.data ?? [];
        setProducts(all.slice(0, 2));
      } catch {
        // non-fatal
      }
    };
    fetch();
  }, [categoryId]);

  if (products.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-gray-100 text-left">
      <h3 className="font-serif text-xl font-light text-gray-900 mb-5 text-center">
        Complete Your Look
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {products.map((p) => {
          const img = p.images.find((i) => i.isPrimary) ?? p.images[0];
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="group block rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
            >
              {img && (
                <div className="relative aspect-square bg-neutral-50">
                  <Image
                    src={img.imageUrl}
                    alt={p.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 200px"
                  />
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-medium text-gray-800 line-clamp-2">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">₹{Number(p.finalPrice).toLocaleString()}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN SUCCESS CONTENT
// ============================================================================

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [animPhase, setAnimPhase] = useState<'truck' | 'reveal'>('truck');
  const [upsellCategoryId, setUpsellCategoryId] = useState<string | undefined>(undefined);
  const clearCart = useCartStore((state) => state.clearCart);
  const { user } = useAuthStore();
  const purchaseTrackedRef = useRef(false);
  const confettiKey = orderId || orderNumber || 'unknown';

  // Check if this is a COD order (has orderNumber param but no orderId)
  const isCODOrder = !orderId && !!orderNumber;

  // ── Fetch order & fire purchase event once confirmed ──
  const fireConversionEvent = async (status: PaymentStatus) => {
    if (purchaseTrackedRef.current) return;
    try {
      const orderRes = await api.get(`/orders/${status.orderId}`);
      const order: OrderDetails = orderRes.data.data || orderRes.data.order;
      if (order) {
        // Capture first item's productId for upsell (category fetched server-side)
        const firstItem = order.items?.[0];
        if (firstItem?.productId && !upsellCategoryId) {
          // Use productId to seed recommended products upsell
          setUpsellCategoryId(firstItem.productId);
        }
        const fired = trackPurchase({
          orderId: order.id,
          orderNumber: order.orderNumber || status.orderNumber,
          total: Number(order.totalAmount) || 0,
          subtotal: Number(order.subtotal) || Number(order.totalAmount) || 0,
          tax: Number(order.taxAmount) || 0,
          shipping: Number(order.shippingCost) || 0,
          items: (order.items || []).map((item) => ({
            id: item.productId || item.id,
            name: item.product?.name || 'Product',
            price: Number(item.unitPrice) || 0,
            quantity: item.quantity,
            category: item.product?.category?.name,
          })),
        });
        if (fired) purchaseTrackedRef.current = true;
      }
    } catch {
      // Order fetch failed — don't block success UI
    }
  };

  // ── Handle COD order — immediate success ──
  useEffect(() => {
    if (!isCODOrder) return;
    setLoading(false);
    // Show confetti only once per order (localStorage guard)
    const played = localStorage.getItem(`ora_success_${confettiKey}`);
    if (!played) {
      setShowConfetti(true);
      localStorage.setItem(`ora_success_${confettiKey}`, '1');
    }
  }, [isCODOrder, confettiKey]);

  // ── Poll for online payment confirmation ──
  useEffect(() => {
    if (!orderId) return;

    // eslint-disable-next-line prefer-const
    let pollInterval: NodeJS.Timeout | undefined;
    let isMounted = true;
    let attemptCount = 0;
    const maxAttempts = 60;

    const pollPaymentStatus = async () => {
      try {
        const response = await api.get(`/payments/${orderId}/status`);
        if (!isMounted) return;

        const status = response.data.success ? response.data : response.data.data;
        setPaymentStatus(status);

        // SUCCESS: Payment confirmed by webhook
        if (status.isConfirmed && !status.isFailed) {
          clearCart();
          setLoading(false);
          clearInterval(pollInterval);

          // Confetti once per order
          const played = localStorage.getItem(`ora_success_${confettiKey}`);
          if (!played) {
            setShowConfetti(true);
            localStorage.setItem(`ora_success_${confettiKey}`, '1');
          }

          fireConversionEvent(status);
          return;
        }
        
        // FAILURE: Payment failed
        if (status.isFailed) {
          clearInterval(pollInterval);
          router.replace(`/checkout/failed?orderId=${orderId}`);
          return;
        }
        
        // TIMEOUT
        if (attemptCount >= maxAttempts) {
          setLoading(false);
          setError('Payment is taking longer than expected. Check your email for confirmation or contact support.');
          clearInterval(pollInterval);
          return;
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error('[Success] Error polling payment status:', err);
        
        if (attemptCount >= maxAttempts) {
          setLoading(false);
          setError('Unable to confirm payment. Please check your email for order details.');
          clearInterval(pollInterval);
        }
      }

      attemptCount++;
    };

    pollPaymentStatus();
    pollInterval = setInterval(pollPaymentStatus, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [orderId, router]);

  // Auto-dismiss confetti after 6 seconds
  useEffect(() => {
    if (!showConfetti) return;
    const timer = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  // Sequenced animation: package throw (1s) → truck starts (0.5s) → drives off (2s) → reveal content
  const isConfirmed = isCODOrder || (paymentStatus?.isConfirmed && paymentStatus?.orderPaymentStatus === 'CONFIRMED');
  const displayOrderId = orderId || orderNumber || '';

  useEffect(() => {
    if (!isConfirmed || loading) return;
    // Phase: Framer Motion animation plays for ~5s, then reveal content
    setAnimPhase('truck');
    const revealTimer = setTimeout(() => setAnimPhase('reveal'), 5000);
    return () => clearTimeout(revealTimer);
  }, [isConfirmed, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white py-12 px-4">
      
      {/* Premium Confetti */}
      {showConfetti && <PremiumConfetti />}

      <div className="max-w-lg mx-auto text-center relative z-20">
        
        {/* ── LOADING STATE (simple spinner while polling) ── */}
        {loading && !isCODOrder && (
          <>
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto relative">
                <div className="absolute inset-0 rounded-full border-4 border-pink-200 animate-spin" style={{ borderTopColor: '#EC4899' }} />
                <div className="absolute inset-3 rounded-full bg-pink-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-serif font-light text-gray-900 mb-3">
              Confirming Your Order…
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              Your payment is being verified. This usually takes a few seconds.
            </p>

            <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Payment Processing</p>
                  <p className="text-xs text-gray-500">
                    Status: {paymentStatus?.paymentStatus || 'PENDING'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-8">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <p className="text-sm text-gray-400">
              Please don&apos;t close this page. You&apos;ll be redirected shortly.
            </p>
          </>
        )}

        {/* ── CONFIRMED STATE — Truck hero → Content reveal ── */}
        {!loading && isConfirmed && (
          <>
            {/* PHASE 1: Jewellery box → package → truck animation → order ID revealed */}
            <OrderSuccessAnimation orderDisplayId={displayOrderId} />

            {/* PHASE 2: Content fades in after truck drives away */}
            <div className={animPhase === 'reveal' ? 'animate-fade-in-up' : 'opacity-0'}>
              <AnimatedCheckmark />

              <h1 className="text-3xl md:text-4xl font-serif font-light text-gray-900 mb-2">
                Order Confirmed! 🎉
              </h1>
              <p className="text-base text-gray-500 mb-2">
                {isCODOrder
                  ? 'Your order has been placed successfully'
                  : 'Payment verified — your order is on its way'}
              </p>
              <p className="text-sm text-emerald-600 font-medium mb-6 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {isCODOrder ? 'Cash on Delivery' : 'Payment Verified'}
              </p>

              {/* Order Details Card (simplified — Order ID already revealed by truck) */}
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-1">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">Payment</p>
                    <p className="text-xs font-semibold text-emerald-600">{isCODOrder ? 'COD' : 'Verified'}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-1">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">Order</p>
                    <p className="text-xs font-semibold text-emerald-600">Confirmed</p>
                  </div>
                </div>
              </div>

              {/* What Happens Next — Timeline */}
              <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 text-left">
                <h3 className="font-serif font-semibold text-gray-900 mb-5 text-center">What happens next?</h3>
              <div className="space-y-5">
                {[
                  { done: true, label: 'Order Confirmed', sub: 'We\'ve received your order and payment' },
                  { done: false, num: '2', label: 'Preparing', sub: 'Your jewellery is being handcrafted' },
                  { done: false, num: '3', label: 'Shipped', sub: 'On its way to you with care' },
                  { done: false, num: '4', label: 'Delivered', sub: 'Beautifully packaged at your doorstep' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{step.num}</span>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${step.done ? 'text-gray-900' : 'text-gray-600'}`}>{step.label}</p>
                      <p className="text-sm text-gray-400">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              {user ? (
                <Link
                  href="/account"
                  className="block w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold text-center hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg"
                >
                  View Order Status
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="block w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold text-center hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg"
                >
                  Create Account to Track Order
                </Link>
              )}
              <Link
                href="/products"
                className="block w-full py-4 border-2 border-gray-200 text-gray-900 rounded-full font-semibold text-center hover:bg-gray-50 transition-all"
              >
                Continue Shopping
              </Link>
            </div>

            {/* ── Post-Checkout Upsell: Complete Your Look ── */}
            <PostCheckoutUpsell categoryId={upsellCategoryId} />

            <p className="mt-8 text-sm text-gray-400">
              A confirmation email has been sent to your registered email address.
            </p>
            </div>
          </>
        )}

        {/* ── PENDING / ERROR STATE ── */}
        {!loading && !isConfirmed && !isCODOrder && (
          <>
            <div className="mb-8">
              <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-amber-500"
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

            <h1 className="text-3xl md:text-4xl font-serif font-light text-gray-900 mb-3">
              Payment Pending
            </h1>
            <p className="text-lg text-gray-500 mb-8">
              {error || 'Your payment could not be confirmed. Please check your email for more details.'}
            </p>

            <div className="space-y-3">
              <Link
                href="/account"
                className="block w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold text-center hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg"
              >
                View Order Status
              </Link>
              <Link
                href="/checkout"
                className="block w-full py-4 border-2 border-gray-200 text-gray-900 rounded-full font-semibold text-center hover:bg-gray-50 transition-all"
              >
                Try Again
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ── CSS Animations (confetti + content reveal only — truck is Framer Motion) ── */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        @keyframes draw-check {
          0% { stroke-dashoffset: 30; stroke-dasharray: 30; }
          100% { stroke-dashoffset: 0; stroke-dasharray: 30; }
        }
        .animate-draw-check {
          animation: draw-check 0.6s ease-out 0.3s forwards;
          stroke-dashoffset: 30;
          stroke-dasharray: 30;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-confetti-fall,
          .animate-draw-check,
          .animate-fade-in-up {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-pink-50/30 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
