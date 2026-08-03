'use client';

/**
 * CampaignPage — "Buy Any Necklace, Get a Ring FREE"
 * ORA Launch Campaign — /collections/combos
 *
 * Design: Premium luxury. Dark charcoal hero, gold accents, white cards.
 * Data:   ALL necklaces shown (no eligibility gating).
 *         Ring section unlocks when necklace is in cart.
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Gift, ShoppingBag, Sparkles, Star, Check, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useOfferStore } from '@/store/offerStore';
import { useCartStore } from '@/store/cartStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OfferProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  image: string | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

// ─── Hero ─────────────────────────────────────────────────────────────────────
function CampaignHero() {
  return (
    <section className="relative bg-[#0F0F14] overflow-hidden py-24 md:py-36">
      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[#C6A85B]/10 blur-[130px]" />
        <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-pink-600/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/8 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#C6A85B]">
            <Sparkles className="h-3 w-3" />
            Limited Time · Launch Offer
            <Sparkles className="h-3 w-3" />
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 font-serif text-4xl font-light leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Buy Any Necklace.
          <br />
          <span className="text-[#C6A85B]">Get a Ring FREE.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="mx-auto mt-6 max-w-xl text-base text-neutral-400 md:text-lg"
        >
          Shop any necklace and choose a complimentary ring — delivered together, zero extra charge.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#necklaces"
            className="group inline-flex items-center gap-3 rounded-full bg-[#C6A85B] px-10 py-4 text-base font-semibold text-[#0F0F14] shadow-lg transition-all hover:bg-[#b8985a] hover:shadow-xl"
          >
            Shop Necklaces
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#rings"
            className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-transparent px-10 py-4 text-base font-medium text-white transition-all hover:bg-white/5"
          >
            <Gift className="h-4 w-4 text-[#C6A85B]" />
            Claim Your Ring
          </a>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Pick a Necklace', desc: 'Add any necklace to your bag.' },
    { n: '02', title: 'Choose a Free Ring', desc: 'Unlocks instantly below.' },
    { n: '03', title: 'Checkout', desc: 'Ring shows at ₹0 automatically.' },
    { n: '04', title: 'Receive Both', desc: 'Shipped together, gift-ready.' },
  ];
  return (
    <section className="border-b border-neutral-100 bg-white py-14">
      <div className="mx-auto max-w-5xl px-5">
        <p className="mb-10 text-center font-serif text-2xl font-light text-neutral-900 md:text-3xl">
          How It Works
        </p>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C6A85B]/40 bg-[#C6A85B]/8">
                <span className="font-serif text-sm font-semibold text-[#C6A85B]">{s.n}</span>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-neutral-900 md:text-base">{s.title}</h3>
              <p className="text-xs text-neutral-500">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-neutral-100 bg-white">
          <div className="aspect-square bg-neutral-100" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 rounded bg-neutral-100" />
            <div className="h-4 w-1/2 rounded bg-neutral-100" />
            <div className="h-9 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Necklace Card ─────────────────────────────────────────────────────────────
function NecklaceCard({ product, onAdd }: { product: OfferProduct; onAdd: (p: OfferProduct) => void }) {
  const [flash, setFlash] = useState(false);
  const inCart = useCartStore((s) => s.items.some((i) => i.productId === product.id && !i.isFreeGift));

  const handleAdd = () => {
    if (inCart) return;
    setFlash(true);
    onAdd(product);
    setTimeout(() => setFlash(false), 900);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      className="group relative overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-shadow hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#FAF9F7]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-neutral-200" />
          </div>
        )}
        {/* Badge */}
        <span className="absolute left-3 top-3 rounded-full bg-[#C6A85B] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
          + Free Ring
        </span>
      </div>

      {/* Body */}
      <div className="p-3 md:p-4">
        <h3 className="line-clamp-2 font-serif text-sm font-medium leading-snug text-neutral-900 md:text-base">
          {product.name}
        </h3>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-neutral-400">
              {product.averageRating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-serif text-lg font-semibold text-neutral-900 md:text-xl">
            {formatINR(product.finalPrice)}
          </span>
          <button
            onClick={handleAdd}
            className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all md:px-5 md:text-sm ${
              inCart || flash
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0F0F14] text-white hover:bg-neutral-700 active:scale-95'
            }`}
          >
            {inCart || flash ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" /> Added
              </span>
            ) : (
              'Add to Bag'
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Ring Card ────────────────────────────────────────────────────────────────
function RingCard({ product, onClaim }: { product: OfferProduct; onClaim: (p: OfferProduct) => void }) {
  const { cartNecklaceCount, claimedRingCount } = useOfferStore();
  const canClaim = cartNecklaceCount > claimedRingCount;
  const isClaimed = useCartStore((s) => s.items.some((i) => i.productId === product.id && i.isFreeGift));

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      className={`group relative overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md ${
        isClaimed ? 'border-emerald-400 ring-1 ring-emerald-400/30' : 'border-neutral-100'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#FAF9F7]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gift className="h-12 w-12 text-neutral-200" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
          FREE
        </span>
        {isClaimed && (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 md:p-4">
        <h3 className="line-clamp-2 font-serif text-sm font-medium leading-snug text-neutral-900 md:text-base">
          {product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-serif text-lg font-bold text-emerald-600">FREE</span>
          <span className="text-sm text-neutral-400 line-through">{formatINR(product.finalPrice)}</span>
        </div>
        <button
          onClick={() => onClaim(product)}
          disabled={!canClaim && !isClaimed}
          className={`mt-3 w-full rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-all md:text-sm ${
            isClaimed
              ? 'bg-emerald-500 text-white'
              : canClaim
              ? 'bg-[#C6A85B] text-[#0F0F14] hover:bg-[#b8985a] active:scale-95'
              : 'cursor-not-allowed bg-neutral-100 text-neutral-400'
          }`}
        >
          {isClaimed ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Ring Claimed
            </span>
          ) : canClaim ? (
            'Claim Free Ring'
          ) : (
            'Add a Necklace First'
          )}
        </button>
      </div>
    </motion.article>
  );
}

// ─── Locked Ring Teaser ───────────────────────────────────────────────────────
function RingLockedState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#C6A85B]/30 bg-[#C6A85B]/3 px-8 py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/10">
        <Gift className="h-7 w-7 text-[#C6A85B]" />
      </div>
      <h3 className="font-serif text-xl font-light text-neutral-800">Your free ring awaits</h3>
      <p className="mt-2 max-w-xs text-sm text-neutral-500">
        Add any necklace above to unlock your complimentary ring selection.
      </p>
      <a
        href="#necklaces"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#C6A85B] px-6 py-2.5 text-sm font-semibold text-[#0F0F14] hover:bg-[#b8985a] transition-colors"
      >
        Browse Necklaces <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </motion.div>
  );
}

// ─── Floating Bar ─────────────────────────────────────────────────────────────
function FloatingBar() {
  const { cartNecklaceCount, claimedRingCount } = useOfferStore();
  const remaining = cartNecklaceCount - claimedRingCount;
  if (cartNecklaceCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
      >
        <div className="flex items-center gap-4 rounded-2xl bg-[#0F0F14] px-5 py-3.5 shadow-2xl">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {cartNecklaceCount} Necklace{cartNecklaceCount !== 1 ? 's' : ''} in bag
            </p>
            <p className={`text-xs ${remaining > 0 ? 'text-[#C6A85B]' : 'text-emerald-400'}`}>
              {remaining > 0
                ? `${remaining} free ring${remaining !== 1 ? 's' : ''} to claim ↓`
                : 'All rings claimed!'}
            </p>
          </div>
          <Link
            href="/cart"
            className="rounded-full bg-[#C6A85B] px-5 py-2 text-sm font-bold text-[#0F0F14] hover:bg-[#b8985a] transition-colors"
          >
            View Bag
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CampaignPage() {
  const { necklaces, rings, isLoading, fetchNecklaces, fetchRings, cartNecklaceCount, claimedRingCount } =
    useOfferStore();
  const { addItem, removeItem, items } = useCartStore();

  useEffect(() => {
    fetchNecklaces();
    fetchRings();
  }, [fetchNecklaces, fetchRings]);

  const handleAddNecklace = useCallback(
    (product: OfferProduct) => {
      const alreadyInCart = items.some((i) => i.productId === product.id && !i.isFreeGift);
      if (alreadyInCart) return;
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        image: product.image || '',
        price: product.finalPrice,
        quantity: 1,
        isFreeGift: false,
      });
    },
    [items, addItem]
  );

  const handleClaimRing = useCallback(
    (product: OfferProduct) => {
      const freeId = product.id + '_free';
      const alreadyClaimed = items.some((i) => i.id === freeId);
      if (alreadyClaimed) {
        removeItem(product.id);
        return;
      }
      if (cartNecklaceCount <= claimedRingCount) return;
      addItem({
        id: freeId,
        productId: product.id,
        name: product.name + ' (Complimentary)',
        image: product.image || '',
        price: 0,
        quantity: 1,
        isFreeGift: true,
      });
    },
    [items, addItem, removeItem, cartNecklaceCount, claimedRingCount]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <CampaignHero />

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── Step 1: Necklaces ──────────────────────────────────────────── */}
      <section id="necklaces" className="bg-[#FAFAF8] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-10 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#C6A85B]/30 bg-[#C6A85B]/8 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#C6A85B]">
              Step 1
            </span>
            <h2 className="font-serif text-2xl font-light text-neutral-900 md:text-3xl">
              Choose Your Necklace
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Every necklace includes a complimentary ring — free.
            </p>
          </div>

          {isLoading ? (
            <GridSkeleton count={8} />
          ) : necklaces.length === 0 ? (
            <p className="py-16 text-center text-neutral-400">No necklaces found. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {necklaces.map((p) => (
                <NecklaceCard key={p.id} product={p} onAdd={handleAddNecklace} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Step 2: Free Rings ─────────────────────────────────────────── */}
      <section id="rings" className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-10 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Step 2
            </span>
            <h2 className="font-serif text-2xl font-light text-neutral-900 md:text-3xl">
              Choose Your Complimentary Ring
            </h2>
            {cartNecklaceCount > 0 ? (
              <p className="mt-2 font-semibold text-emerald-600 text-sm">
                {claimedRingCount < cartNecklaceCount
                  ? `${cartNecklaceCount - claimedRingCount} free ring${cartNecklaceCount - claimedRingCount !== 1 ? 's' : ''} available to claim`
                  : 'All complimentary rings claimed!'}
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">
                Add an eligible necklace above to unlock your free ring.
              </p>
            )}
          </div>

          {cartNecklaceCount === 0 ? (
            <RingLockedState />
          ) : isLoading ? (
            <GridSkeleton count={6} />
          ) : rings.length === 0 ? (
            <p className="py-16 text-center text-neutral-400">No rings available. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {rings.map((p) => (
                <RingCard key={p.id} product={p} onClaim={handleClaimRing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Trust Strip ───────────────────────────────────────────────── */}
      <section className="border-y border-neutral-100 bg-[#FAFAF8] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: '✦', label: 'Free Ring', sub: 'With every necklace' },
              { icon: '◈', label: 'No Coupon', sub: 'Applied automatically' },
              { icon: '⬡', label: 'Free Shipping', sub: 'On all orders' },
              { icon: '◎', label: 'Easy Returns', sub: '7-day exchange' },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center text-center">
                <span className="mb-2 text-xl text-[#C6A85B]">{t.icon}</span>
                <p className="text-sm font-semibold text-neutral-800">{t.label}</p>
                <p className="text-xs text-neutral-500">{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Floating CTA bar ─────────────────────────────────────────── */}
      <FloatingBar />
    </div>
  );
}
