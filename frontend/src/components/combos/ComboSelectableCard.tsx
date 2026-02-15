'use client';

/**
 * ComboSelectableCard — Product card with selection state for BOGO
 *
 * Features:
 *   - White card with product image
 *   - Hover: fade to model wearing image
 *   - Selection: pink border + checkmark badge
 *   - "Select for Combo" button
 *   - Shows tier badge (₹999 / ₹1499 / etc.)
 */

import { useBOGOStore, BOGOProduct } from '@/store/bogoStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Package, Star } from 'lucide-react';
import Image from 'next/image';
import { memo, useState } from 'react';

interface ComboSelectableCardProps {
  product: BOGOProduct;
  index?: number;
  priority?: boolean;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);

export default function ComboSelectableCard({
  product,
  index = 0,
  priority = false,
}: ComboSelectableCardProps) {
  const { selectedProducts, selectProduct, deselectProduct } = useBOGOStore();
  const [isHovered, setIsHovered] = useState(false);

  const isSelected = selectedProducts.some((p) => p.id === product.id);
  const canSelect = selectedProducts.length < 2 || isSelected;

  const handleToggle = () => {
    if (isSelected) {
      deselectProduct(product.id);
    } else if (canSelect) {
      selectProduct(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.3) }}
      className="group relative overflow-hidden rounded-2xl transition-all duration-500 cursor-pointer"
      style={{
        background: '#FFFFFF',
        border: isSelected ? '2px solid #E91E63' : '1px solid #ECECF2',
        boxShadow: isSelected
          ? '0 8px 32px rgba(233,30,99,0.2)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleToggle}
    >
      {/* Selected checkmark badge */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: '#E91E63' }}
        >
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </motion.div>
      )}

      {/* Tier badge */}
      <div
        className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-[10px] font-sans font-bold tracking-wider uppercase"
        style={{ background: '#C6A85B', color: '#FFFFFF' }}
      >
        ₹{product.bogoPriceTier}
      </div>

      {/* ——— IMAGE SECTION ——— */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: '#FAFAFA' }}
      >
        {/* Hover model image */}
        <AnimatePresence>
          {isHovered && product.hoverImage && (
            <motion.div
              key="hover-img"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10"
            >
              <Image
                src={product.hoverImage}
                alt={`${product.name} — Model wearing`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product image */}
        <div className="relative w-full h-full flex items-center justify-center p-6">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain drop-shadow-lg"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
            />
          ) : (
            <Package className="w-16 h-16 text-neutral-200" />
          )}
        </div>
      </div>

      {/* ——— CONTENT SECTION ——— */}
      <div className="p-4 md:p-5">
        {/* Product Name */}
        <h3
          className="font-serif text-base md:text-lg font-medium leading-snug mb-2 line-clamp-2"
          style={{ color: '#111111' }}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(product.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-sans" style={{ color: '#7A7A85' }}>
              {product.averageRating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mb-4">
          <span
            className="font-serif text-2xl font-semibold"
            style={{ color: '#111111' }}
          >
            {formatPrice(product.finalPrice)}
          </span>
        </div>

        {/* Selection button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          disabled={!canSelect && !isSelected}
          className="w-full py-3 rounded-xl font-sans text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300"
          style={{
            background: isSelected
              ? '#10b981'
              : !canSelect
                ? '#E5E7EB'
                : '#E91E63',
            color: !canSelect && !isSelected ? '#9CA3AF' : '#FFFFFF',
            boxShadow:
              isSelected || canSelect
                ? '0 4px 16px rgba(233,30,99,0.25)'
                : 'none',
            cursor: !canSelect && !isSelected ? 'not-allowed' : 'pointer',
          }}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" />
              <span>Selected</span>
            </>
          ) : !canSelect ? (
            <span>Max 2 Selected</span>
          ) : (
            <span>Select for Combo</span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}


// Only one default export allowed
// If you want to memoize, do it at import site or use named export
