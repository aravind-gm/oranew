'use client';

/**
 * ComboProductCard — Premium BOGO card for the combos campaign
 *
 * CRITICAL LAYOUT:
 *   - "BUY 1 GET 1 FREE" pink badge (top)
 *   - Split image: Product 1 | + | Product 2 (white bg)
 *   - On hover: fade to model-wearing shot (300ms)
 *   - Product name, price layout with savings in gold
 *   - Wishlist heart top-right
 *   - [ Add Combo to Bag ] primary + [ View Details ] link
 *   - Card lift on hover
 *
 * On CTA click: adds both SKUs to cart, shows toast
 */

import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import { ComboProduct } from '@/store/comboStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Heart,
  Package,
  ShoppingBag,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

interface ComboProductCardProps {
  combo: ComboProduct;
  index?: number;
  priority?: boolean;
}

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

function ComboProductCard({
  combo,
  index = 0,
  priority = false,
}: ComboProductCardProps) {
  const { addItem } = useCartStore();
  const { showNotification } = useCartNotificationStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for staggered entry animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' },
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

    // Toast notification
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
    }, 2200);
  }, [combo, addItem, showNotification, isAdding]);

  const hasHoverImage = !!combo.images.hover;
  const isMostGifted = combo.badge === 'Most Gifted';

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      className="group relative overflow-hidden rounded-2xl transition-all duration-500"
      style={{
        background: '#FFFFFF',
        border: '1px solid #ECECF2',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card lift on hover via inline style */}
      <style jsx>{`
        .group:hover {
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
          transform: translateY(-4px);
        }
      `}</style>

      {/* ——— TOP BADGE: BUY 1 GET 1 FREE ——— */}
      <div
        className="absolute top-3 left-3 z-20 px-3 py-1 rounded-full text-[10px] font-sans font-bold tracking-[0.12em] uppercase"
        style={{ background: '#E91E63', color: '#FFFFFF' }}
      >
        Buy 1 Get 1 Free
      </div>

      {/* Most Gifted badge */}
      {isMostGifted && (
        <div
          className="absolute top-3 left-[140px] z-20 px-2.5 py-1 rounded-full text-[9px] font-sans font-bold tracking-wider uppercase"
          style={{ background: '#C6A85B', color: '#FFFFFF' }}
        >
          🎁 Most Gifted
        </div>
      )}

      {/* Wishlist heart */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsWishlisted(!isWishlisted);
        }}
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(4px)',
        }}
        aria-label="Add to wishlist"
      >
        <Heart
          className={`w-4 h-4 transition-all duration-300 ${
            isWishlisted ? 'fill-red-500 text-red-500 scale-110' : 'text-neutral-400'
          }`}
        />
      </button>

      {/* ——— IMAGE SECTION: Split Layout ——— */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: '#FAFAFA' }}
      >
        {/* Hover model image (fades in 300ms) */}
        <AnimatePresence>
          {isHovered && hasHoverImage && (
            <motion.div
              key="hover-img"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10"
            >
              <Image
                src={combo.images.hover}
                alt={`${combo.title} — Model wearing`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split product images */}
        <div className="relative w-full h-full flex items-center justify-center px-4">
          {/* Product 1 */}
          <div className="relative w-[40%] h-[78%]">
            {combo.images.primary ? (
              <Image
                src={combo.images.primary}
                alt={combo.primaryProduct.name}
                fill
                className="object-contain drop-shadow-md"
                sizes="(max-width: 640px) 40vw, 18vw"
                priority={priority}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg">
                <Package className="w-8 h-8 text-neutral-300" />
              </div>
            )}
          </div>

          {/* Plus icon */}
          <div className="flex flex-col items-center mx-3 z-[5]">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
              style={{
                background: 'rgba(198,168,91,0.1)',
                border: '1.5px solid rgba(198,168,91,0.3)',
              }}
            >
              <span
                className="font-serif text-xl font-bold"
                style={{ color: '#C6A85B' }}
              >
                +
              </span>
            </div>
          </div>

          {/* Product 2 */}
          <div className="relative w-[40%] h-[78%]">
            {combo.images.free ? (
              <Image
                src={combo.images.free}
                alt={combo.freeProduct.name}
                fill
                className="object-contain drop-shadow-md"
                sizes="(max-width: 640px) 40vw, 18vw"
                priority={priority}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-lg">
                <Package className="w-8 h-8 text-neutral-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ——— CONTENT SECTION ——— */}
      <div className="p-4 md:p-5">
        {/* Product Name */}
        <h3
          className="font-serif text-base md:text-lg font-medium leading-snug mb-2 line-clamp-2"
          style={{ color: '#111111' }}
        >
          {combo.title}
        </h3>

        {/* Rating */}
        {combo.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(combo.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-200'
                  }`}
                />
              ))}
            </div>
            <span
              className="text-xs font-sans"
              style={{ color: '#7A7A85' }}
            >
              {combo.averageRating.toFixed(1)} ({combo.reviewCount})
            </span>
          </div>
        )}

        {/* ——— PRICE LAYOUT ——— */}
        <div
          className="mb-4 p-3 rounded-xl"
          style={{
            background: '#F6E9EE',
            border: '1px solid rgba(233,30,99,0.08)',
          }}
        >
          <div className="flex items-baseline gap-2">
            <span
              className="font-serif text-2xl font-semibold"
              style={{ color: '#111111' }}
            >
              {formatPrice(combo.comboPrice)}
            </span>
            <span
              className="text-sm line-through font-sans"
              style={{ color: '#7A7A85' }}
            >
              {formatPrice(combo.originalTotal)}
            </span>
          </div>
          <div
            className="flex items-center gap-1 mt-1 text-sm font-sans font-semibold"
            style={{ color: '#C6A85B' }}
          >
            <span>You Save {formatPrice(combo.savingsAmount)}</span>
          </div>
        </div>

        {/* ——— BUTTONS ——— */}
        <div className="flex flex-col gap-2">
          {/* Add Combo to Bag */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAddToCart}
            disabled={isAdding || combo.stockQuantity === 0}
            className="w-full py-3 rounded-xl font-sans text-sm font-semibold tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300"
            style={{
              background: isAdded
                ? '#10b981'
                : combo.stockQuantity === 0
                  ? '#E5E7EB'
                  : '#E91E63',
              color: combo.stockQuantity === 0 ? '#9CA3AF' : '#FFFFFF',
              boxShadow:
                !isAdded && combo.stockQuantity > 0
                  ? '0 4px 16px rgba(233,30,99,0.25)'
                  : 'none',
              cursor:
                combo.stockQuantity === 0 ? 'not-allowed' : 'pointer',
            }}
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

          {/* View Details */}
          <Link
            href={`/products/${combo.slug}`}
            className="w-full py-2.5 rounded-xl font-sans text-xs font-medium tracking-wider uppercase text-center transition-all duration-300"
            style={{
              color: '#7A7A85',
              border: '1px solid #ECECF2',
            }}
          >
            View Details
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ComboProductCard);
