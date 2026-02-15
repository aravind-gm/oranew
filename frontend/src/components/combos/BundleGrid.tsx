'use client';

/**
 * BundleGrid — Responsive grid layout for BundleCards
 * 
 * Mobile: 1 column
 * Tablet: 2 columns
 * Desktop: 3 columns
 * 
 * Includes loading skeleton and empty state.
 */

import { ComboProduct } from '@/store/comboStore';
import { motion } from 'framer-motion';
import { Gift, Loader2 } from 'lucide-react';
import BundleCard from './BundleCard';

interface BundleGridProps {
  combos: ComboProduct[];
  loading: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-neutral-100 animate-pulse">
          {/* Image skeleton */}
          <div className="aspect-[4/3] bg-neutral-100 relative">
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              <div className="w-[42%] h-[80%] bg-neutral-200 rounded-lg" />
              <div className="w-8 h-8 bg-neutral-200 rounded-full" />
              <div className="w-[42%] h-[80%] bg-neutral-200 rounded-lg" />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-7 bg-neutral-200" />
          </div>
          {/* Content skeleton */}
          <div className="p-5 space-y-3">
            <div className="h-5 bg-neutral-100 rounded w-3/4" />
            <div className="h-3 bg-neutral-100 rounded w-1/3" />
            <div className="h-16 bg-neutral-50 rounded-xl" />
            <div className="space-y-1.5">
              <div className="h-3 bg-neutral-100 rounded w-2/3" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
            <div className="h-11 bg-neutral-200 rounded-xl" />
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
      className="text-center py-16 px-4"
    >
      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Gift className="w-7 h-7 text-primary-400" />
      </div>
      <h3 className="font-serif text-xl text-neutral-900 mb-2">
        Combo Sets Coming Soon
      </h3>
      <p className="text-sm text-neutral-500 font-sans max-w-md mx-auto leading-relaxed">
        Our curated jewellery combos are being crafted with love.
        Check back soon for exclusive Buy 1 Get 1 Free deals.
      </p>
    </motion.div>
  );
}

export default function BundleGrid({ combos, loading }: BundleGridProps) {
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2 mb-6 text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-sans">Loading combos...</span>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (combos.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.map((combo, index) => (
          <BundleCard
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
