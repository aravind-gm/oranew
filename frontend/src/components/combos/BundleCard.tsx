'use client';

/**
 * BundleCard — Premium BOGO combo card for "Combos for Her"
 * 
 * CRITICAL DESIGN:
 * - Split image layout: Primary + Free product with "+" between
 * - "Buy 1 Get 1 Free" badge
 * - Hover: fade to model image
 * - Price: ₹2,499 combo / ₹4,998 original / "You Save ₹2,499"
 * - "🔥 50% OFF EFFECTIVE" badge
 * - "What's Included" bullet list
 * - Full-width "Add Combo to Bag" CTA
 * - Rating display
 * - Bestseller / Limited / Most Gifted badge
 * 
 * On CTA click: adds both SKUs to cart at combo price, shows toast
 */

import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { ComboProduct } from '@/store/comboStore';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Flame, Gift, Package, ShoppingBag, Star, Tag } from 'lucide-react';
import Image from 'next/image';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

interface BundleCardProps {
  combo: ComboProduct;
  index?: number;
  priority?: boolean;
}

const BADGE_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Bestseller: { bg: 'bg-gold-500', text: 'text-white', icon: <Star className="w-3 h-3" /> },
  Limited: { bg: 'bg-primary-500', text: 'text-white', icon: <Tag className="w-3 h-3" /> },
  'Most Gifted': { bg: 'bg-pink-500', text: 'text-white', icon: <Gift className="w-3 h-3" /> },
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

function BundleCard({ combo, index = 0, priority = false }: BundleCardProps) {
  const { addItem } = useCartStore();
  const { showNotification } = useCartNotificationStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for staggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = useCallback(() => {
    if (isAdding) return;
    setIsAdding(true);

    // Add primary product at combo price
    addItem({
      id: `combo-${combo.id}-primary`,
      productId: combo.primaryProduct.id,
      name: `${combo.title} — ${combo.primaryProduct.name}`,
      image: combo.images.primary || combo.primaryProduct.image || '',
      price: combo.comboPrice,
      quantity: 1,
    });

    // Add free product at ₹0
    addItem({
      id: `combo-${combo.id}-free`,
      productId: combo.freeProduct.id,
      name: `${combo.title} — ${combo.freeProduct.name} (FREE)`,
      image: combo.images.free || combo.freeProduct.image || '',
      price: 0,
      quantity: 1,
    });

    // Show toast notification
    if (showNotification) {
      showNotification({
        productId: combo.id,
        productName: `${combo.title} — 2 items added. You saved ${formatPrice(combo.savingsAmount)}`,
        productImage: combo.images.primary,
        productPrice: combo.comboPrice,
        quantity: 2,
      });
    }

    setIsAdded(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(false);
    }, 2000);
  }, [combo, addItem, showNotification, isAdding]);

  const badge = combo.badge ? BADGE_STYLES[combo.badge] || BADGE_STYLES.Bestseller : null;
  const hasHoverImage = !!combo.images.hover;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-primary-100/30 transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Badge */}
      {badge && (
        <div className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 ${badge.bg} ${badge.text} text-[10px] font-sans font-semibold tracking-wider uppercase px-3 py-1 rounded-full shadow-md`}>
          {badge.icon}
          <span>{combo.badge}</span>
        </div>
      )}

      {/* Limited tag */}
      {combo.isLimited && (
        <div className="absolute top-3 right-3 z-20 bg-neutral-900 text-white text-[10px] font-sans font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full">
          New Arrival
        </div>
      )}

      {/* ============================================ */}
      {/* IMAGE SECTION — Split Layout */}
      {/* ============================================ */}
      <div className="relative aspect-[4/3] bg-neutral-50 overflow-hidden">
        {/* Hover model image */}
        <AnimatePresence>
          {isHovered && hasHoverImage && (
            <motion.div
              key="hover-image"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10"
            >
              <Image
                src={combo.images.hover}
                alt={`${combo.title} - Model`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split product images */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Primary product */}
          <div className="relative w-[42%] h-[80%]">
            {combo.images.primary ? (
              <Image
                src={combo.images.primary}
                alt={combo.primaryProduct.name}
                fill
                className="object-contain drop-shadow-md"
                sizes="(max-width: 640px) 42vw, 20vw"
                priority={priority}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg">
                <Package className="w-8 h-8 text-neutral-300" />
              </div>
            )}
          </div>

          {/* Plus icon */}
          <div className="flex flex-col items-center mx-2 z-10">
            <div className="w-8 h-8 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center shadow-sm">
              <span className="text-gold-600 font-serif text-lg font-bold">+</span>
            </div>
          </div>

          {/* Free product */}
          <div className="relative w-[42%] h-[80%]">
            {combo.images.free ? (
              <Image
                src={combo.images.free}
                alt={combo.freeProduct.name}
                fill
                className="object-contain drop-shadow-md"
                sizes="(max-width: 640px) 42vw, 20vw"
                priority={priority}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg">
                <Gift className="w-8 h-8 text-neutral-300" />
              </div>
            )}
          </div>
        </div>

        {/* "Buy 1 Get 1 Free" ribbon at bottom of image */}
        <div className="absolute bottom-0 inset-x-0 z-10">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-1.5 px-3">
            <span className="text-[11px] font-sans font-semibold tracking-[0.15em] uppercase">
              Buy 1 Get 1 Free
            </span>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CONTENT SECTION */}
      {/* ============================================ */}
      <div className="p-4 md:p-5">
        {/* Title */}
        <h3 className="font-serif text-base md:text-lg font-medium text-neutral-900 leading-snug mb-2 line-clamp-2">
          {combo.title}
        </h3>

        {/* Rating */}
        {combo.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(combo.averageRating) ? 'text-gold-400 fill-gold-400' : 'text-neutral-200'}`}
                />
              ))}
            </div>
            <span className="text-xs text-neutral-500 font-sans">
              {combo.averageRating.toFixed(1)} ({combo.reviewCount})
            </span>
          </div>
        )}

        {/* ============================================ */}
        {/* PRICE DISPLAY */}
        {/* ============================================ */}
        <div className="mb-3 p-3 bg-primary-50/40 rounded-xl border border-primary-100/50">
          {/* Combo price */}
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-semibold text-neutral-900">
              {formatPrice(combo.comboPrice)}
            </span>
            <span className="text-sm text-neutral-400 line-through font-sans">
              {formatPrice(combo.originalTotal)}
            </span>
          </div>

          {/* Savings */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-sans font-medium text-green-600">
              You Save {formatPrice(combo.savingsAmount)}
            </span>
          </div>

          {/* Discount badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-600 text-[11px] font-sans font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full">
            <Flame className="w-3 h-3" />
            <span>{Math.round(combo.discountPercent)}% OFF EFFECTIVE</span>
          </div>
        </div>

        {/* ============================================ */}
        {/* WHAT'S INCLUDED */}
        {/* ============================================ */}
        {combo.includes && combo.includes.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400 mb-1.5">
              What&apos;s Included
            </p>
            <ul className="space-y-1">
              {combo.includes.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-neutral-600 font-sans">
                  <Check className="w-3 h-3 text-gold-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ============================================ */}
        {/* CTA BUTTON */}
        {/* ============================================ */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleAddToCart}
          disabled={isAdding || combo.stockQuantity === 0}
          className={`
            w-full py-3 rounded-xl font-sans text-sm font-semibold tracking-wider uppercase
            flex items-center justify-center gap-2
            transition-all duration-300
            ${
              isAdded
                ? 'bg-green-500 text-white'
                : combo.stockQuantity === 0
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : 'bg-neutral-900 hover:bg-gold-500 text-white shadow-md hover:shadow-lg hover:shadow-gold-400/20'
            }
          `}
        >
          {isAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>Added to Bag!</span>
            </>
          ) : combo.stockQuantity === 0 ? (
            <span>Sold Out</span>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add Combo to Bag</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default memo(BundleCard);
