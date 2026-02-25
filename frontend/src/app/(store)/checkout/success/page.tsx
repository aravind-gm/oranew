'use client';

import api from '@/lib/api';
import { trackPurchase } from '@/lib/analytics';
import Link from 'next/link';
import Image from 'next/image';
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
// DELIVERY TRUCK HERO
// Sequence: Truck waits → Package thrown in → Truck drives off right → Order ID revealed
// ============================================================================

function DeliveryTruckHero({ orderDisplayId }: { orderDisplayId: string }) {
  return (
    <div className="relative w-full max-w-lg mx-auto mb-4 overflow-hidden" style={{ height: 220 }}>

      {/* ── ORDER ID — hidden behind truck, revealed when truck drives away ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0 animate-order-reveal">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Your Order</p>
        <p className="text-base sm:text-lg font-mono font-bold text-pink-600 break-all px-4 text-center">
          {orderDisplayId}
        </p>
      </div>

      {/* ── ROAD ── */}
      <div className="absolute bottom-5 left-0 right-0 z-10">
        <div className="h-px bg-gray-200" />
        <svg width="100%" height="4" className="mt-1">
          <line x1="0" y1="2" x2="100%" y2="2" stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="8 5" />
        </svg>
      </div>

      {/* ── ORA PACKAGE — flies in from left, arcs into truck ── */}
      <div className="absolute z-30 animate-package-throw" style={{ left: -60, bottom: 80 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Box */}
          <rect x="4" y="12" width="40" height="30" rx="4" fill="#FDFBF7" stroke="#EC4899" strokeWidth="2" />
          {/* Ribbon vertical */}
          <line x1="24" y1="12" x2="24" y2="42" stroke="#EC4899" strokeWidth="1.5" />
          {/* Ribbon horizontal */}
          <line x1="4" y1="27" x2="44" y2="27" stroke="#EC4899" strokeWidth="1.5" />
          {/* Bow */}
          <ellipse cx="24" cy="12" rx="8" ry="5" fill="#EC4899" />
          <ellipse cx="24" cy="12" rx="4" ry="3" fill="#FDF2F8" />
          {/* ORA text */}
          <text x="24" y="23" textAnchor="middle" fill="#EC4899" fontSize="8" fontWeight="800" fontFamily="serif">ORA</text>
        </svg>
      </div>

      {/* ── TRUCK — waits, receives package, then drives off right ── */}
      <div className="absolute bottom-8 z-20 animate-truck-scene" style={{ left: 'calc(50% - 120px)', width: 240 }}>
        <svg
          viewBox="0 0 240 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* ── Cargo body (pink) ── */}
          <rect x="0" y="12" width="130" height="62" rx="5" fill="#EC4899" />
          {/* Body top highlight */}
          <rect x="0" y="12" width="130" height="5" rx="3" fill="#F472B6" />
          {/* Body bottom shadow */}
          <rect x="0" y="69" width="130" height="5" rx="2" fill="#DB2777" />

          {/* ── ORA branding on body ── */}
          <text x="65" y="42" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="serif" letterSpacing="5">
            ORA
          </text>
          <text x="65" y="56" textAnchor="middle" fill="white" fontSize="6" fontWeight="400" fontFamily="sans-serif" letterSpacing="2" opacity="0.8">
            JEWELLERY
          </text>

          {/* ── Cargo door lines ── */}
          <line x1="0" y1="30" x2="0" y2="70" stroke="#DB2777" strokeWidth="2" />
          <rect x="2" y="38" width="3" height="10" rx="1" fill="#F9A8D4" />

          {/* ── Cabin ── */}
          <path d="M130 24 L130 74 L190 74 L200 52 L190 24 Z" fill="#DB2777" />
          {/* Windshield */}
          <path d="M134 28 L186 28 L194 50 L134 50 Z" fill="#FDF2F8" opacity="0.6" />
          {/* Windshield glare */}
          <path d="M138 32 L150 32 L147 46 L136 46 Z" fill="white" opacity="0.35" />
          {/* Side mirror */}
          <rect x="196" y="36" width="8" height="4" rx="1" fill="#F9A8D4" />
          {/* Bumper */}
          <rect x="196" y="60" width="10" height="14" rx="2" fill="#6B7280" />
          {/* Headlight */}
          <rect x="198" y="54" width="8" height="6" rx="2" fill="#FDE68A" opacity="0.9" />
          {/* Tail light */}
          <rect x="-2" y="58" width="4" height="8" rx="1" fill="#EF4444" opacity="0.8" />

          {/* ── Rear wheel ── */}
          <g className="animate-wheels">
            <circle cx="40" cy="82" r="12" fill="#374151" />
            <circle cx="40" cy="82" r="7" fill="#6B7280" />
            <circle cx="40" cy="82" r="3" fill="#9CA3AF" />
            <line x1="40" y1="71" x2="40" y2="93" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="29" y1="82" x2="51" y2="82" stroke="#9CA3AF" strokeWidth="1" />
          </g>

          {/* ── Middle wheel ── */}
          <g className="animate-wheels">
            <circle cx="90" cy="82" r="12" fill="#374151" />
            <circle cx="90" cy="82" r="7" fill="#6B7280" />
            <circle cx="90" cy="82" r="3" fill="#9CA3AF" />
            <line x1="90" y1="71" x2="90" y2="93" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="79" y1="82" x2="101" y2="82" stroke="#9CA3AF" strokeWidth="1" />
          </g>

          {/* ── Front wheel ── */}
          <g className="animate-wheels">
            <circle cx="170" cy="82" r="12" fill="#374151" />
            <circle cx="170" cy="82" r="7" fill="#6B7280" />
            <circle cx="170" cy="82" r="3" fill="#9CA3AF" />
            <line x1="170" y1="71" x2="170" y2="93" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="159" y1="82" x2="181" y2="82" stroke="#9CA3AF" strokeWidth="1" />
          </g>

          {/* ── Exhaust puffs (only visible during drive-off phase) ── */}
          <circle cx="-10" cy="68" r="5" fill="#D1D5DB" opacity="0.5" className="animate-exhaust-1" />
          <circle cx="-22" cy="64" r="4" fill="#D1D5DB" opacity="0.3" className="animate-exhaust-2" />
          <circle cx="-32" cy="60" r="3" fill="#D1D5DB" opacity="0.15" className="animate-exhaust-3" />
        </svg>
      </div>
    </div>
  );
}

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
    // Phase: truck animation plays for ~4s, then reveal content
    setAnimPhase('truck');
    const revealTimer = setTimeout(() => setAnimPhase('reveal'), 4200);
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
            {/* PHASE 1: Package thrown into truck → truck drives off → order ID revealed */}
            <DeliveryTruckHero orderDisplayId={displayOrderId} />

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

        /* ── PACKAGE THROW: arcs from left into the truck bed ── */
        @keyframes package-throw {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate(60px, -60px) rotate(-20deg) scale(1);
          }
          45% {
            transform: translate(200px, -110px) rotate(-40deg) scale(1.05);
          }
          70% {
            transform: translate(310px, -30px) rotate(-10deg) scale(1);
          }
          80% {
            transform: translate(310px, -10px) rotate(5deg) scale(0.95);
          }
          90% {
            transform: translate(310px, -18px) rotate(0deg) scale(1);
          }
          100% {
            transform: translate(310px, -14px) rotate(0deg) scale(0.85);
            opacity: 0;
          }
        }
        .animate-package-throw {
          animation: package-throw 1.4s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          opacity: 0;
        }

        /* ── TRUCK SCENE: stays put for 1.8s, then drives off to the right ── */
        @keyframes truck-scene {
          0% {
            transform: translateX(0);
          }
          /* Stay still while package arrives (0 → 40%) */
          40% {
            transform: translateX(0);
          }
          /* Slight nudge back (truck "starts") */
          48% {
            transform: translateX(-8px);
          }
          /* Accelerate right */
          60% {
            transform: translateX(20px);
          }
          80% {
            transform: translateX(200px);
          }
          100% {
            transform: translateX(calc(50vw + 280px));
          }
        }
        .animate-truck-scene {
          animation: truck-scene 3.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* ── WHEELS: idle first, then spin fast during drive ── */
        @keyframes wheels-spin {
          0% { transform: rotate(0deg); }
          40% { transform: rotate(0deg); }
          48% { transform: rotate(-20deg); }
          100% { transform: rotate(1440deg); }
        }
        .animate-wheels {
          transform-origin: center;
          animation: wheels-spin 3.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* ── EXHAUST: only puffs during drive-off phase ── */
        @keyframes exhaust-puff {
          0%, 42% { opacity: 0; transform: translateX(0) scale(0.5); }
          50% { opacity: 0.6; transform: translateX(-5px) scale(1); }
          100% { opacity: 0; transform: translateX(-40px) scale(2); }
        }
        .animate-exhaust-1 {
          animation: exhaust-puff 3.8s ease-out forwards;
        }
        .animate-exhaust-2 {
          animation: exhaust-puff 3.8s ease-out 0.15s forwards;
        }
        .animate-exhaust-3 {
          animation: exhaust-puff 3.8s ease-out 0.3s forwards;
        }

        /* ── ORDER REVEAL: hidden behind truck, fades in as truck moves away ── */
        @keyframes order-reveal {
          0%, 55% {
            opacity: 0;
            transform: translateY(8px) scale(0.95);
          }
          70% {
            opacity: 0.6;
            transform: translateY(4px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-order-reveal {
          animation: order-reveal 3.8s ease-out forwards;
          opacity: 0;
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
          .animate-truck-scene,
          .animate-wheels,
          .animate-package-throw,
          .animate-exhaust-1,
          .animate-exhaust-2,
          .animate-exhaust-3,
          .animate-order-reveal,
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
