'use client';

import api from '@/lib/api';
import { trackPurchase } from '@/lib/analytics';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/store/cartStore';

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
// DELIVERY TRUCK HERO — Drives in from left, parcel shows Order ID
// ============================================================================

function DeliveryTruckHero({ orderDisplayId }: { orderDisplayId: string }) {
  // Truncate order ID for parcel label (first 8 chars)
  const parcelLabel = orderDisplayId
    ? (orderDisplayId.length > 8 ? orderDisplayId.slice(0, 8) + '…' : orderDisplayId)
    : 'ORA';

  return (
    <div className="relative w-full max-w-md mx-auto mb-8 overflow-hidden" style={{ height: 180 }}>
      {/* Road surface */}
      <div className="absolute bottom-4 left-0 right-0 h-px bg-gray-200" />
      <div className="absolute bottom-3 left-0 right-0">
        <svg width="100%" height="4" className="text-gray-300">
          <line x1="0" y1="2" x2="100%" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="10 6" />
        </svg>
      </div>

      {/* Truck container — drives in from left */}
      <div className="animate-truck-drive-in absolute bottom-6" style={{ width: 280 }}>
        <svg
          viewBox="0 0 280 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* ── Truck cargo body ── */}
          <rect x="10" y="24" width="140" height="72" rx="6" fill="#1A1A1A" />
          {/* Cargo body highlight */}
          <rect x="10" y="24" width="140" height="6" rx="3" fill="#333" />

          {/* ── ORA Logo on truck body ── */}
          <text x="80" y="55" textAnchor="middle" fill="#D4AF77" fontSize="20" fontWeight="700" fontFamily="serif" letterSpacing="4">
            ORA
          </text>
          <text x="80" y="70" textAnchor="middle" fill="#D4AF77" fontSize="7" fontWeight="400" fontFamily="sans-serif" letterSpacing="2" opacity="0.7">
            JEWELLERY
          </text>

          {/* ── Parcel box on truck ── */}
          <g className="animate-parcel-shimmer">
            {/* Box */}
            <rect x="38" y="4" width="52" height="20" rx="3" fill="#FDFBF7" stroke="#D4AF77" strokeWidth="1.5" />
            {/* Ribbon cross */}
            <line x1="64" y1="4" x2="64" y2="24" stroke="#D4AF77" strokeWidth="1" />
            <line x1="38" y1="14" x2="90" y2="14" stroke="#D4AF77" strokeWidth="1" />
            {/* Bow on top */}
            <circle cx="64" cy="4" r="3" fill="#D4AF77" />
            {/* Order ID label */}
            <text x="64" y="11" textAnchor="middle" fill="#1A1A1A" fontSize="5" fontWeight="600" fontFamily="monospace">
              {parcelLabel}
            </text>
          </g>

          {/* ── Truck cabin ── */}
          <path d="M150 40 L150 96 L210 96 L220 72 L210 40 Z" fill="#2A2A2A" />
          {/* Windshield */}
          <path d="M155 44 L205 44 L215 70 L155 70 Z" fill="#FDF2F8" opacity="0.5" rx="2" />
          {/* Windshield glare */}
          <path d="M160 48 L170 48 L168 65 L158 65 Z" fill="white" opacity="0.3" />
          {/* Bumper */}
          <rect x="215" y="80" width="12" height="16" rx="2" fill="#374151" />
          {/* Headlight */}
          <rect x="220" y="74" width="8" height="6" rx="2" fill="#FDE68A" opacity="0.9" />

          {/* ── Rear wheels ── */}
          <g className="animate-wheel-spin-drive">
            <circle cx="50" cy="100" r="12" fill="#374151" />
            <circle cx="50" cy="100" r="7" fill="#6B7280" />
            <circle cx="50" cy="100" r="3" fill="#9CA3AF" />
            {/* Spokes */}
            <line x1="50" y1="89" x2="50" y2="111" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="39" y1="100" x2="61" y2="100" stroke="#9CA3AF" strokeWidth="1" />
          </g>
          <g className="animate-wheel-spin-drive">
            <circle cx="100" cy="100" r="12" fill="#374151" />
            <circle cx="100" cy="100" r="7" fill="#6B7280" />
            <circle cx="100" cy="100" r="3" fill="#9CA3AF" />
            <line x1="100" y1="89" x2="100" y2="111" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="89" y1="100" x2="111" y2="100" stroke="#9CA3AF" strokeWidth="1" />
          </g>

          {/* ── Front wheel ── */}
          <g className="animate-wheel-spin-drive">
            <circle cx="190" cy="100" r="12" fill="#374151" />
            <circle cx="190" cy="100" r="7" fill="#6B7280" />
            <circle cx="190" cy="100" r="3" fill="#9CA3AF" />
            <line x1="190" y1="89" x2="190" y2="111" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="179" y1="100" x2="201" y2="100" stroke="#9CA3AF" strokeWidth="1" />
          </g>

          {/* ── Exhaust puffs ── */}
          <circle cx="5" cy="88" r="5" fill="#D1D5DB" opacity="0.5" className="animate-puff-1" />
          <circle cx="-8" cy="84" r="4" fill="#D1D5DB" opacity="0.3" className="animate-puff-2" />
          <circle cx="-18" cy="80" r="3" fill="#D1D5DB" opacity="0.15" className="animate-puff-3" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// ANIMATED CHECKMARK COMPONENT (small, inline after truck)
// ============================================================================

function AnimatedCheckmark() {
  return (
    <div className="relative w-16 h-16 mx-auto mb-4">
      {/* Outer pulse ring */}
      <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping" style={{ animationDuration: '2s' }} />
      {/* Inner circle */}
      <div className="absolute inset-2 rounded-full bg-emerald-500 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
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
  const clearCart = useCartStore((state) => state.clearCart);
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

  // Sequenced animation: truck drives in (2.5s) → reveal content
  const isConfirmed = isCODOrder || (paymentStatus?.isConfirmed && paymentStatus?.orderPaymentStatus === 'CONFIRMED');
  const displayOrderId = orderId || orderNumber || '';

  useEffect(() => {
    if (!isConfirmed || loading) return;
    // Phase: truck drives in for 2.8s, then reveal content
    setAnimPhase('truck');
    const revealTimer = setTimeout(() => setAnimPhase('reveal'), 2800);
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
            {/* PHASE 1: Delivery truck drives in with parcel */}
            <DeliveryTruckHero orderDisplayId={displayOrderId} />

            {/* PHASE 2: Content fades in after truck stops */}
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

              {/* Order ID Card */}
              {displayOrderId && (
                <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Order Number</p>
                  <p className="text-lg font-mono font-bold text-pink-600 break-all">{displayOrderId}</p>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
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
              )}

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
              <Link
                href="/account"
                className="block w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold text-center hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg"
              >
                View Order Status
              </Link>
              <Link
                href="/products"
                className="block w-full py-4 border-2 border-gray-200 text-gray-900 rounded-full font-semibold text-center hover:bg-gray-50 transition-all"
              >
                Continue Shopping
              </Link>
            </div>

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

      {/* ── CSS Animations ── */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall linear forwards;
        }
        
        @keyframes truck-drive-in {
          0% { left: -300px; }
          70% { left: calc(50% - 140px); }
          85% { left: calc(50% - 130px); }
          100% { left: calc(50% - 140px); }
        }
        .animate-truck-drive-in {
          animation: truck-drive-in 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        @keyframes wheel-spin-drive {
          0% { transform: rotate(0deg); }
          70% { transform: rotate(720deg); }
          100% { transform: rotate(720deg); }
        }
        .animate-wheel-spin-drive {
          transform-origin: center;
          animation: wheel-spin-drive 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        @keyframes parcel-shimmer {
          0%, 70% { filter: brightness(1); }
          80% { filter: brightness(1.3); }
          90% { filter: brightness(1); }
          100% { filter: brightness(1.05); }
        }
        .animate-parcel-shimmer {
          animation: parcel-shimmer 2.5s ease forwards;
        }
        
        @keyframes puff {
          0% { opacity: 0.6; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(-20px) scale(1.8); }
        }
        .animate-puff-1 {
          animation: puff 1.2s ease-out infinite;
        }
        .animate-puff-2 {
          animation: puff 1.2s ease-out infinite 0.3s;
        }
        .animate-puff-3 {
          animation: puff 1.2s ease-out infinite 0.6s;
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
          .animate-truck-drive-in,
          .animate-wheel-spin-drive,
          .animate-parcel-shimmer,
          .animate-puff-1,
          .animate-puff-2,
          .animate-puff-3,
          .animate-draw-check,
          .animate-fade-in-up {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
            left: calc(50% - 140px) !important;
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
