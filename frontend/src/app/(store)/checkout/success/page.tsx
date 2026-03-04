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
// DELIVERY TRUCK HERO — Cinematic 3D-Style Animation
// Sequence: Scene loads → Delivery guy walks in → Throws package → 
//           Package arcs into truck → Truck starts → Drives off → Order ID revealed
// ============================================================================

function DeliveryTruckHero({ orderDisplayId }: { orderDisplayId: string }) {
  return (
    <div className="relative w-full max-w-2xl mx-auto mb-6 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50" style={{ height: 300 }}>
      
      {/* ── SKY & ENVIRONMENT ── */}
      <div className="absolute inset-0">
        {/* Clouds floating */}
        <div className="absolute top-6 left-[10%] animate-cloud-1">
          <svg width="80" height="30" viewBox="0 0 80 30" fill="white" opacity="0.6">
            <ellipse cx="40" cy="20" rx="40" ry="12" />
            <ellipse cx="25" cy="14" rx="20" ry="10" />
            <ellipse cx="55" cy="14" rx="22" ry="10" />
          </svg>
        </div>
        <div className="absolute top-14 right-[15%] animate-cloud-2">
          <svg width="60" height="24" viewBox="0 0 60 24" fill="white" opacity="0.4">
            <ellipse cx="30" cy="16" rx="30" ry="10" />
            <ellipse cx="18" cy="10" rx="16" ry="8" />
            <ellipse cx="42" cy="12" rx="18" ry="8" />
          </svg>
        </div>
        {/* Sun */}
        <div className="absolute top-4 right-8">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-200 to-amber-300 opacity-70 blur-sm" />
          <div className="absolute inset-1 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 opacity-90" />
        </div>
      </div>

      {/* ── GROUND / ROAD ── */}
      <div className="absolute bottom-0 left-0 right-0 h-16 z-10">
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-stone-300 to-stone-200" />
        {/* Road */}
        <div className="absolute bottom-3 left-0 right-0 h-6 bg-gray-600 rounded-t-sm">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 border-t-2 border-dashed border-yellow-300/60 -translate-y-1/2" />
        </div>
        {/* Curb */}
        <div className="absolute bottom-9 left-0 right-0 h-1 bg-stone-400" />
      </div>

      {/* ── ORDER ID — hidden behind truck, revealed when truck drives away ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-5 animate-order-reveal">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg border border-pink-100">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mx-auto mb-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-1 font-medium">Your Order</p>
          <p className="text-lg sm:text-xl font-mono font-bold text-pink-600 break-all text-center">
            #{orderDisplayId}
          </p>
        </div>
      </div>

      {/* ── WAREHOUSE / BUILDING in background ── */}
      <div className="absolute bottom-10 left-4 z-8">
        <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
          <rect x="5" y="20" width="80" height="60" rx="3" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1" />
          <rect x="5" y="15" width="80" height="10" rx="2" fill="#F472B6" />
          <text x="45" y="23" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="serif">ORA</text>
          {/* Door */}
          <rect x="30" y="50" width="25" height="30" rx="2" fill="#9CA3AF" />
          <rect x="32" y="52" width="21" height="26" rx="1" fill="#6B7280" />
          {/* Windows */}
          <rect x="12" y="30" width="14" height="14" rx="1" fill="#BFDBFE" opacity="0.7" />
          <rect x="60" y="30" width="14" height="14" rx="1" fill="#BFDBFE" opacity="0.7" />
        </svg>
      </div>

      {/* ── DELIVERY PERSON — walks in from left, throws package ── */}
      <div className="absolute z-30 animate-person-walk" style={{ left: -80, bottom: 16 }}>
        <svg width="50" height="80" viewBox="0 0 50 80" fill="none">
          {/* Head */}
          <circle cx="25" cy="12" r="9" fill="#FBBF24" />
          <circle cx="25" cy="12" r="8" fill="#FDE68A" />
          {/* Cap */}
          <ellipse cx="25" cy="8" rx="10" ry="4" fill="#EC4899" />
          <rect x="15" y="6" width="20" height="4" rx="2" fill="#EC4899" />
          {/* Eyes */}
          <circle cx="22" cy="11" r="1.2" fill="#1F2937" />
          <circle cx="28" cy="11" r="1.2" fill="#1F2937" />
          {/* Smile */}
          <path d="M22 15 Q25 18 28 15" stroke="#1F2937" strokeWidth="1" fill="none" strokeLinecap="round" />
          {/* Body (ORA uniform) */}
          <rect x="16" y="22" width="18" height="24" rx="4" fill="#EC4899" />
          <text x="25" y="37" textAnchor="middle" fill="white" fontSize="6" fontWeight="800" fontFamily="serif">ORA</text>
          {/* Arms — throwing pose */}
          <g className="animate-person-throw">
            <rect x="6" y="24" width="10" height="5" rx="2.5" fill="#FDE68A" transform="rotate(-30 6 24)" />
            <rect x="34" y="22" width="12" height="5" rx="2.5" fill="#FDE68A" transform="rotate(20 34 22)" />
          </g>
          {/* Legs — walking */}
          <g className="animate-person-legs">
            <rect x="18" y="46" width="5" height="20" rx="2" fill="#374151" />
            <rect x="27" y="46" width="5" height="20" rx="2" fill="#374151" />
          </g>
          {/* Shoes */}
          <rect x="16" y="64" width="8" height="4" rx="2" fill="#4B5563" />
          <rect x="26" y="64" width="8" height="4" rx="2" fill="#4B5563" />
        </svg>
      </div>

      {/* ── ORA PACKAGE — flies from person's hands into truck ── */}
      <div className="absolute z-35 animate-package-throw" style={{ left: 80, bottom: 60 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          {/* Box with 3D perspective */}
          <rect x="4" y="10" width="36" height="28" rx="3" fill="#FDFBF7" stroke="#EC4899" strokeWidth="2" />
          {/* Box lid shadow */}
          <rect x="4" y="10" width="36" height="6" rx="2" fill="#FDF2F8" stroke="#EC4899" strokeWidth="1.5" />
          {/* Ribbon vertical */}
          <line x1="22" y1="10" x2="22" y2="38" stroke="#EC4899" strokeWidth="1.5" />
          {/* Ribbon horizontal */}
          <line x1="4" y1="24" x2="40" y2="24" stroke="#EC4899" strokeWidth="1.5" />
          {/* Bow */}
          <ellipse cx="22" cy="10" rx="7" ry="4.5" fill="#EC4899" />
          <ellipse cx="22" cy="10" rx="3.5" ry="2.5" fill="#FDF2F8" />
          {/* ORA text on box */}
          <text x="22" y="21" textAnchor="middle" fill="#EC4899" fontSize="7" fontWeight="800" fontFamily="serif">ORA</text>
          {/* Sparkles around package during flight */}
          <circle cx="2" cy="5" r="1.5" fill="#F472B6" className="animate-sparkle-1" />
          <circle cx="42" cy="8" r="1" fill="#FBBF24" className="animate-sparkle-2" />
          <circle cx="38" cy="40" r="1.5" fill="#F472B6" className="animate-sparkle-3" />
        </svg>
      </div>

      {/* ── DELIVERY TRUCK — premium ORA branded, waits for package, then drives off ── */}
      <div className="absolute bottom-6 z-20 animate-truck-scene" style={{ left: 'calc(50% - 100px)', width: 260 }}>
        <svg viewBox="0 0 260 110" fill="none" className="w-full h-full drop-shadow-lg">
          {/* ── Cargo body (gradient pink) ── */}
          <defs>
            <linearGradient id="cargoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
            <linearGradient id="cabinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#BE185D" />
              <stop offset="100%" stopColor="#9D174D" />
            </linearGradient>
          </defs>
          
          <rect x="0" y="14" width="140" height="65" rx="6" fill="url(#cargoGrad)" />
          {/* Body shine effect */}
          <rect x="4" y="16" width="132" height="8" rx="3" fill="white" opacity="0.15" />
          {/* Body bottom edge */}
          <rect x="0" y="73" width="140" height="6" rx="2" fill="#9D174D" />

          {/* ── ORA branding on body ── */}
          <text x="70" y="44" textAnchor="middle" fill="white" fontSize="26" fontWeight="700" fontFamily="serif" letterSpacing="6">
            ORA
          </text>
          <text x="70" y="58" textAnchor="middle" fill="white" fontSize="7" fontWeight="400" fontFamily="sans-serif" letterSpacing="3" opacity="0.7">
            JEWELLERY
          </text>
          {/* Decorative line */}
          <line x1="25" y1="64" x2="115" y2="64" stroke="white" strokeWidth="0.5" opacity="0.3" />

          {/* ── Cargo door lines ── */}
          <line x1="1" y1="32" x2="1" y2="75" stroke="#9D174D" strokeWidth="2" />
          <rect x="3" y="42" width="4" height="12" rx="2" fill="#F9A8D4" />

          {/* ── Cabin ── */}
          <path d="M140 26 L140 79 L205 79 L218 55 L205 26 Z" fill="url(#cabinGrad)" />
          {/* Windshield */}
          <path d="M145 30 L200 30 L212 53 L145 53 Z" fill="#E0F2FE" opacity="0.7" />
          {/* Windshield glare */}
          <path d="M149 34 L164 34 L160 49 L147 49 Z" fill="white" opacity="0.4" />
          {/* Windshield divider */}
          <line x1="175" y1="30" x2="183" y2="53" stroke="#9D174D" strokeWidth="1" opacity="0.4" />
          {/* Side mirror */}
          <rect x="214" y="38" width="10" height="5" rx="2" fill="#F9A8D4" />
          <rect x="215" y="39" width="8" height="3" rx="1" fill="#E0F2FE" opacity="0.5" />
          {/* Front bumper */}
          <rect x="212" y="64" width="14" height="15" rx="3" fill="#6B7280" />
          <rect x="214" y="66" width="10" height="11" rx="2" fill="#9CA3AF" opacity="0.3" />
          {/* Headlights */}
          <rect x="216" y="56" width="10" height="7" rx="3" fill="#FDE68A" opacity="0.9" />
          <rect x="217" y="57" width="4" height="5" rx="2" fill="white" opacity="0.5" />
          {/* Tail light */}
          <rect x="-3" y="60" width="5" height="10" rx="2" fill="#EF4444" opacity="0.8" />
          {/* Front grill */}
          <rect x="214" y="60" width="10" height="3" rx="1" fill="#4B5563" />

          {/* ── Rear wheel ── */}
          <g className="animate-wheels">
            <circle cx="42" cy="88" r="14" fill="#1F2937" />
            <circle cx="42" cy="88" r="10" fill="#374151" />
            <circle cx="42" cy="88" r="6" fill="#6B7280" />
            <circle cx="42" cy="88" r="3" fill="#9CA3AF" />
            {/* Spokes */}
            <line x1="42" y1="75" x2="42" y2="101" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="29" y1="88" x2="55" y2="88" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="32" y1="79" x2="52" y2="97" stroke="#9CA3AF" strokeWidth="0.8" />
            <line x1="52" y1="79" x2="32" y2="97" stroke="#9CA3AF" strokeWidth="0.8" />
          </g>

          {/* ── Middle wheel ── */}
          <g className="animate-wheels">
            <circle cx="100" cy="88" r="14" fill="#1F2937" />
            <circle cx="100" cy="88" r="10" fill="#374151" />
            <circle cx="100" cy="88" r="6" fill="#6B7280" />
            <circle cx="100" cy="88" r="3" fill="#9CA3AF" />
            <line x1="100" y1="75" x2="100" y2="101" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="87" y1="88" x2="113" y2="88" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="90" y1="79" x2="110" y2="97" stroke="#9CA3AF" strokeWidth="0.8" />
            <line x1="110" y1="79" x2="90" y2="97" stroke="#9CA3AF" strokeWidth="0.8" />
          </g>

          {/* ── Front wheel ── */}
          <g className="animate-wheels">
            <circle cx="185" cy="88" r="14" fill="#1F2937" />
            <circle cx="185" cy="88" r="10" fill="#374151" />
            <circle cx="185" cy="88" r="6" fill="#6B7280" />
            <circle cx="185" cy="88" r="3" fill="#9CA3AF" />
            <line x1="185" y1="75" x2="185" y2="101" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="172" y1="88" x2="198" y2="88" stroke="#9CA3AF" strokeWidth="1" />
            <line x1="175" y1="79" x2="195" y2="97" stroke="#9CA3AF" strokeWidth="0.8" />
            <line x1="195" y1="79" x2="175" y2="97" stroke="#9CA3AF" strokeWidth="0.8" />
          </g>

          {/* ── Exhaust puffs (during drive-off) ── */}
          <g className="animate-exhaust-puffs">
            <circle cx="-8" cy="72" r="6" fill="#D1D5DB" opacity="0.5" />
            <circle cx="-20" cy="66" r="5" fill="#D1D5DB" opacity="0.35" />
            <circle cx="-30" cy="60" r="4" fill="#D1D5DB" opacity="0.2" />
            <circle cx="-40" cy="56" r="3" fill="#D1D5DB" opacity="0.1" />
          </g>

          {/* ── Dust particles from wheels ── */}
          <g className="animate-dust">
            <circle cx="30" cy="100" r="3" fill="#D4B896" opacity="0.3" />
            <circle cx="15" cy="98" r="2" fill="#D4B896" opacity="0.2" />
            <circle cx="88" cy="100" r="3" fill="#D4B896" opacity="0.3" />
            <circle cx="75" cy="98" r="2" fill="#D4B896" opacity="0.2" />
          </g>
        </svg>
      </div>

      {/* ── Motion lines during truck drive-off ── */}
      <div className="absolute bottom-14 left-0 z-15 animate-motion-lines" style={{ opacity: 0 }}>
        <svg width="120" height="30" viewBox="0 0 120 30">
          <line x1="0" y1="8" x2="80" y2="8" stroke="#F9A8D4" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="10" y1="15" x2="100" y2="15" stroke="#F9A8D4" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <line x1="20" y1="22" x2="90" y2="22" stroke="#F9A8D4" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
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
    // Phase: truck animation plays for ~6s, then reveal content
    setAnimPhase('truck');
    const revealTimer = setTimeout(() => setAnimPhase('reveal'), 6000);
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

        /* ── CLOUDS — gentle floating ── */
        @keyframes cloud-float-1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(30px); }
        }
        @keyframes cloud-float-2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        .animate-cloud-1 {
          animation: cloud-float-1 8s ease-in-out infinite;
        }
        .animate-cloud-2 {
          animation: cloud-float-2 10s ease-in-out infinite;
        }

        /* ── DELIVERY PERSON — walks in from left, stops at truck ── */
        @keyframes person-walk {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          25% {
            /* Walk to middle of scene */
            transform: translateX(calc(50vw - 60px));
          }
          35% {
            /* Stop at truck, prepare to throw */
            transform: translateX(calc(50vw - 60px)) translateY(0);
          }
          40% {
            /* Throwing motion - lean back */
            transform: translateX(calc(50vw - 60px)) translateY(-5px);
          }
          45% {
            /* Throw! */
            transform: translateX(calc(50vw - 60px)) translateY(0);
          }
          55% {
            /* Step back */
            transform: translateX(calc(50vw - 100px));
          }
          65% {
            /* Wave */
            transform: translateX(calc(50vw - 100px));
          }
          80% {
            /* Walk back out */
            transform: translateX(-20px);
            opacity: 1;
          }
          90% {
            opacity: 0;
          }
          100% {
            transform: translateX(-80px);
            opacity: 0;
          }
        }
        .animate-person-walk {
          animation: person-walk 5.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
          opacity: 0;
        }

        /* ── PERSON THROW ARM motion ── */
        @keyframes person-throw {
          0%, 35% { transform: rotate(0deg); }
          40% { transform: rotate(-45deg); }
          45% { transform: rotate(30deg); }
          50%, 100% { transform: rotate(0deg); }
        }
        .animate-person-throw {
          transform-origin: 50% 50%;
          animation: person-throw 5.5s ease-out forwards;
        }

        /* ── PERSON LEGS walking ── */
        @keyframes person-legs {
          0%, 5% { transform: skewX(0deg); }
          8% { transform: skewX(5deg); }
          12% { transform: skewX(-5deg); }
          16% { transform: skewX(5deg); }
          20% { transform: skewX(-5deg); }
          25%, 35% { transform: skewX(0deg); }
          55% { transform: skewX(0deg); }
          60% { transform: skewX(-5deg); }
          65% { transform: skewX(5deg); }
          70% { transform: skewX(-5deg); }
          75% { transform: skewX(5deg); }
          80%, 100% { transform: skewX(0deg); }
        }
        .animate-person-legs {
          animation: person-legs 5.5s ease-in-out forwards;
        }

        /* ── PACKAGE THROW: arcs from person into truck bed ── */
        @keyframes package-throw {
          0%, 35% {
            transform: translate(0, 0) rotate(0deg) scale(0.6);
            opacity: 0;
          }
          38% {
            opacity: 1;
            transform: translate(30px, -20px) rotate(-15deg) scale(0.9);
          }
          42% {
            transform: translate(100px, -90px) rotate(-35deg) scale(1.1);
          }
          48% {
            transform: translate(180px, -70px) rotate(-20deg) scale(1);
          }
          52% {
            transform: translate(210px, -20px) rotate(-5deg) scale(0.95);
          }
          55% {
            transform: translate(210px, -10px) rotate(5deg) scale(0.9);
          }
          58% {
            /* Landed in truck - bounce */
            transform: translate(210px, -18px) rotate(0deg) scale(0.85);
          }
          62% {
            transform: translate(210px, -14px) rotate(0deg) scale(0.8);
            opacity: 1;
          }
          68% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        .animate-package-throw {
          animation: package-throw 5.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
          opacity: 0;
        }

        /* ── SPARKLES on package ── */
        @keyframes sparkle {
          0%, 35%, 70%, 100% { opacity: 0; transform: scale(0); }
          42%, 52% { opacity: 1; transform: scale(1.2); }
          58% { opacity: 0.5; transform: scale(0.8); }
        }
        .animate-sparkle-1 { animation: sparkle 5.5s ease-out forwards; }
        .animate-sparkle-2 { animation: sparkle 5.5s ease-out 0.1s forwards; }
        .animate-sparkle-3 { animation: sparkle 5.5s ease-out 0.2s forwards; }

        /* ── TRUCK SCENE: waits for person+package, then truck starts and drives off ── */
        @keyframes truck-scene {
          0% {
            transform: translateX(0);
          }
          /* Stay still while person arrives and throws package (0 → 62%) */
          62% {
            transform: translateX(0);
          }
          /* Engine start - slight shake */
          64% {
            transform: translateX(2px) translateY(-1px);
          }
          66% {
            transform: translateX(-2px) translateY(1px);
          }
          68% {
            transform: translateX(0) translateY(0);
          }
          /* Slight nudge back (truck "shifts gear") */
          70% {
            transform: translateX(-8px);
          }
          /* Accelerate! */
          78% {
            transform: translateX(30px);
          }
          88% {
            transform: translateX(200px);
          }
          100% {
            transform: translateX(calc(50vw + 300px));
          }
        }
        .animate-truck-scene {
          animation: truck-scene 5.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* ── WHEELS: idle → engine shake → spin fast ── */
        @keyframes wheels-spin {
          0%, 62% { transform: rotate(0deg); }
          64% { transform: rotate(5deg); }
          66% { transform: rotate(-5deg); }
          68% { transform: rotate(0deg); }
          70% { transform: rotate(-20deg); }
          100% { transform: rotate(2160deg); }
        }
        .animate-wheels {
          transform-origin: center;
          animation: wheels-spin 5.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* ── EXHAUST PUFFS — appear during drive-off ── */
        @keyframes exhaust-puffs {
          0%, 68% { opacity: 0; transform: translateX(0) scale(0.5); }
          72% { opacity: 0.7; transform: translateX(-5px) scale(1); }
          85% { opacity: 0.4; transform: translateX(-20px) scale(1.5); }
          100% { opacity: 0; transform: translateX(-50px) scale(2.5); }
        }
        .animate-exhaust-puffs {
          animation: exhaust-puffs 5.5s ease-out forwards;
        }

        /* ── DUST from wheels ── */
        @keyframes dust {
          0%, 68% { opacity: 0; transform: translateX(0) scale(0.3); }
          75% { opacity: 0.5; transform: translateX(-10px) scale(1); }
          90% { opacity: 0.2; transform: translateX(-30px) scale(1.5); }
          100% { opacity: 0; transform: translateX(-50px) scale(2); }
        }
        .animate-dust {
          animation: dust 5.5s ease-out forwards;
        }

        /* ── MOTION LINES during drive-off ── */
        @keyframes motion-lines {
          0%, 72% { opacity: 0; transform: translateX(100px); }
          78% { opacity: 0.8; transform: translateX(60px); }
          88% { opacity: 0.4; transform: translateX(20px); }
          100% { opacity: 0; transform: translateX(-20px); }
        }
        .animate-motion-lines {
          animation: motion-lines 5.5s ease-out forwards;
        }

        /* ── ORDER REVEAL: fades in after truck drives away ── */
        @keyframes order-reveal {
          0%, 78% {
            opacity: 0;
            transform: translateY(12px) scale(0.9);
          }
          88% {
            opacity: 0.7;
            transform: translateY(4px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-order-reveal {
          animation: order-reveal 5.5s ease-out forwards;
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
          .animate-exhaust-puffs,
          .animate-dust,
          .animate-motion-lines,
          .animate-order-reveal,
          .animate-draw-check,
          .animate-fade-in-up,
          .animate-person-walk,
          .animate-person-throw,
          .animate-person-legs,
          .animate-cloud-1,
          .animate-cloud-2,
          .animate-sparkle-1,
          .animate-sparkle-2,
          .animate-sparkle-3 {
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
