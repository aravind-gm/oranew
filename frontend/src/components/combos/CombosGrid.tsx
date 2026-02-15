'use client';

/**
 * CombosGrid — Responsive grid of ComboProductCards
 *
 * Desktop: 3 columns
 * Tablet:  2 columns
 * Mobile:  1 column
 *
 * Loading skeleton + "Coming Soon" empty state (no "0 combos found").
 */

import { ComboProduct } from '@/store/comboStore';
import { motion } from 'framer-motion';
import { Gift, Loader2 } from 'lucide-react';
import ComboProductCard from './ComboProductCard';

interface CombosGridProps {
  combos: ComboProduct[];
  loading: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden animate-pulse"
          style={{ background: '#FFFFFF', border: '1px solid #ECECF2' }}
        >
          {/* Image skeleton */}
          <div
            className="aspect-[4/3] relative"
            style={{ background: '#FAFAFA' }}
          >
            <div className="absolute inset-0 flex items-center justify-center gap-4 px-6">
              <div className="w-[40%] h-[70%] bg-neutral-200 rounded-lg" />
              <div className="w-9 h-9 bg-neutral-200 rounded-full" />
              <div className="w-[40%] h-[70%] bg-neutral-200 rounded-lg" />
            </div>
          </div>
          {/* Content skeleton */}
          <div className="p-5 space-y-3">
            <div className="h-5 bg-neutral-100 rounded w-3/4" />
            <div className="h-3 bg-neutral-100 rounded w-1/3" />
            <div
              className="h-16 rounded-xl"
              style={{ background: '#F6E9EE' }}
            />
            <div className="h-11 bg-neutral-200 rounded-xl" />
            <div className="h-9 rounded-xl" style={{ border: '1px solid #ECECF2' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 px-4"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: '#F6E9EE' }}
      >
        <Gift className="w-7 h-7" style={{ color: '#E91E63' }} />
      </div>
      <h3
        className="font-serif text-xl mb-2"
        style={{ color: '#111111' }}
      >
        Combo Sets Coming Soon
      </h3>
      <p
        className="text-sm font-sans max-w-md mx-auto leading-relaxed"
        style={{ color: '#7A7A85' }}
      >
        Our curated jewellery combos are being crafted with love. Check back
        soon for exclusive Buy 1 Get 1 Free deals.
      </p>
    </motion.div>
  );
}

export default function CombosGrid({ combos, loading }: CombosGridProps) {
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Loader2
            className="w-4 h-4 animate-spin"
            style={{ color: '#7A7A85' }}
          />
          <span className="text-sm font-sans" style={{ color: '#7A7A85' }}>
            Loading combos…
          </span>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (combos.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo, index) => (
          <ComboProductCard
            key={combo.id}
            combo={combo}
            index={index}
            priority={index < 3}
          />
        ))}
      </div>
    </div>
  );
}
