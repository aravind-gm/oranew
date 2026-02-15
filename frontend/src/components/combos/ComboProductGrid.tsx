'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBogoStore, type BOGOProduct } from '@/store/bogoStore';
import ComboSelectableCard from './ComboSelectableCard';

export default function ComboProductGrid() {
  const {
    eligibleProducts,
    selectedTier,
    selectedCategory,
    isLoading,
    fetchEligibleProducts,
  } = useBogoStore();

  useEffect(() => {
    fetchEligibleProducts(selectedTier ?? undefined, selectedCategory);
  }, [selectedTier, selectedCategory, fetchEligibleProducts]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="aspect-square bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-10 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!eligibleProducts || eligibleProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-ora-rose mb-6">
            <svg
              className="w-10 h-10 text-ora-accent"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-medium text-ora-text mb-3">
            No products found
          </h3>
          <p className="text-ora-muted max-w-md mx-auto">
            Try adjusting your filters or select a different price tier to see
            available products.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
        {['all', 'earrings', 'necklaces', 'rings', 'bracelets'].map((cat) => (
          <button
            key={cat}
            onClick={() => useBogoStore.getState().setSelectedCategory(cat)}
            className={`
              px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${
                selectedCategory === cat
                  ? 'bg-ora-accent text-white'
                  : 'bg-white text-ora-text border border-ora-border hover:border-ora-accent'
              }
            `}
          >
            {cat === 'all' ? 'All Products' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.05,
            },
          },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {eligibleProducts.map((product: BOGOProduct) => (
          <motion.div
            key={product.id}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <ComboSelectableCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      {/* Results Count */}
      <div className="mt-8 text-center text-sm text-ora-muted">
        Showing {eligibleProducts.length} product
        {eligibleProducts.length !== 1 ? 's' : ''}
        {selectedTier ? ` in ₹${selectedTier.toLocaleString()} tier` : ''}
      </div>
    </div>
  );
};
