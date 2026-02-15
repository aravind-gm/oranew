'use client';

/**
 * ComboSummaryBar — Sticky bar showing selected items + Add Combo CTA
 *
 * Shows:
 *   - "1 of 2 selected" counter
 *   - Selected product thumbnails
 *   - Savings preview: "You save ₹1,499"
 *   - "Add Combo to Bag" button (enabled when 2 selected)
 *
 * Fixed at bottom on mobile, floating on desktop
 */

import { useBOGOStore } from '@/store/bogoStore';
import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShoppingBag, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);

export default function ComboSummaryBar() {
  const {
    selectedProducts,
    deselectProduct,
    clearSelection,
    canAddToCart,
    getTotalPrice,
    getSavings,
  } = useBOGOStore();
  const { addItem } = useCartStore();
  const { showNotification } = useCartNotificationStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
    if (!canAddToCart() || isAdding) return;
    setIsAdding(true);

    // Add both products to cart
    selectedProducts.forEach((product, idx) => {
      const discount = idx === 0 ? getSavings() : 0; // Apply discount to first item
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        image: product.image,
        price: product.finalPrice - discount,
        quantity: 1,
      });
    });

    // Show toast
    if (showNotification) {
      showNotification({
        productId: 'bogo-combo',
        productName: `BOGO Combo — 2 items added. You saved ${formatPrice(getSavings())}`,
        productImage: selectedProducts[0]?.image || '',
        productPrice: getTotalPrice(),
        quantity: 2,
      });
    }

    clearSelection();
    setTimeout(() => setIsAdding(false), 1500);
  };

  if (selectedProducts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 inset-x-0 z-40 md:bottom-6 md:left-1/2 md:-translate-x-1/2 md:max-w-3xl md:rounded-2xl shadow-2xl"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #ECECF2',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="px-4 py-4 md:px-6">
          {/* Top row: selection counter + clear */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-sm font-sans font-medium"
              style={{ color: '#111111' }}
            >
              {selectedProducts.length} of 2 selected
            </span>
            {selectedProducts.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs font-sans underline transition-colors"
                style={{ color: '#7A7A85' }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Selected products thumbnails */}
          <div className="flex items-center gap-3 mb-4">
            {selectedProducts.map((product) => (
              <div
                key={product.id}
                className="relative group rounded-lg overflow-hidden"
                style={{
                  width: '80px',
                  height: '80px',
                  border: '2px solid #E91E63',
                }}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {/* Remove button */}
                <button
                  onClick={() => deselectProduct(product.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}

            {/* Empty slot */}
            {selectedProducts.length === 1 && (
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '80px',
                  height: '80px',
                  border: '2px dashed #ECECF2',
                  background: '#FAFAFA',
                }}
              >
                <span className="text-xs font-sans" style={{ color: '#7A7A85' }}>
                  Select 1 more
                </span>
              </div>
            )}
          </div>

          {/* Savings + CTA */}
          <div className="flex items-center gap-3">
            {/* Savings preview */}
            {selectedProducts.length === 2 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex-1 rounded-xl p-3"
                style={{
                  background: 'rgba(198,168,91,0.08)',
                  border: '1px solid rgba(198,168,91,0.2)',
                }}
              >
                <div
                  className="text-xs font-sans mb-0.5"
                  style={{ color: '#7A7A85' }}
                >
                  You save
                </div>
                <div
                  className="text-lg font-serif font-semibold"
                  style={{ color: '#C6A85B' }}
                >
                  {formatPrice(getSavings())}
                </div>
              </motion.div>
            )}

            {/* Add to Cart button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={!canAddToCart() || isAdding}
              className="flex-1 py-3.5 rounded-xl font-sans text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canAddToCart() && !isAdding ? '#E91E63' : '#E5E7EB',
                color: canAddToCart() && !isAdding ? '#FFFFFF' : '#9CA3AF',
                boxShadow:
                  canAddToCart() && !isAdding
                    ? '0 4px 16px rgba(233,30,99,0.3)'
                    : 'none',
              }}
            >
              {isAdding ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Combo to Bag</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
