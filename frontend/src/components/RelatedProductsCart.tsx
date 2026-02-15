'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — CART PAGE UPSELL SECTIONS
 * ============================================================================
 * 
 * SMART RECOMMENDATIONS FOR CONVERSION
 * 
 * Shows "You may also like" section on cart page to increase AOV
 * Features:
 * - Smart product recommendations based on cart items
 * - "You may also like" section (best-sellers & same category)
 * - "Perfect Valentine Add-Ons" section (gift-tagged & tumblers)
 * - Horizontal scroll on mobile, grid on desktop
 * - Silent add-to-cart (mini popup instead of navigation)
 * - Premium styling with ORA brand colors (blush pink, warm off-white)
 * 
 * DESIGN PRINCIPLES:
 * ✓ Carousel layout, not overwhelming
 * ✓ Product cards with image, name, price, quick-add
 * ✓ Soft blush/pink background section
 * ✓ Rounded cards with subtle shadows
 * ✓ Dense, organized layout
 * ✓ Mobile-first responsive
 */

import { useCartStore } from '@/store/cartStore';
import { useCartNotificationStore } from '@/store/cartNotificationStore';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBag, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent?: number;
  category?: string;
  tags?: string[];
  images: Array<{
    id: string;
    imageUrl: string;
    isPrimary: boolean;
    altText: string;
  }>;
}

export default function RelatedProductsCart() {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [valentineProducts, setValentineProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem, items } = useCartStore();
  const { showNotification } = useCartNotificationStore();

  // Fetch smart related products based on cart items
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch "You may also like" products:
      // 1. Best-sellers first
      // 2. Then filtered by tags or category if available
      const relatedParams = {
        limit: 6,
        sort: '-sales',
      };

      // Fetch "Perfect Valentine Add-Ons":
      // Tagged as valentine/gift/tumbler products
      const valentineParams = {
        limit: 6,
        tags: ['valentine', 'gift', 'tumbler'],
        sort: '-createdAt',
      };

      const [relatedRes, valentineRes] = await Promise.all([
        api.get('/products', { params: relatedParams }),
        api.get('/products', { params: valentineParams }),
      ]);

      // Set products, filtering out items already in cart
      const cartIds = new Set(items.map(item => item.productId || item.id));
      
      const relatedProds = (relatedRes.data.products || []).filter(
        (p: Product) => !cartIds.has(p.id)
      ).slice(0, 6);
      
      const valentineProds = (valentineRes.data.products || []).filter(
        (p: Product) => !cartIds.has(p.id)
      ).slice(0, 6);

      setRelatedProducts(relatedProds);
      setValentineProducts(valentineProds);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
      setRelatedProducts([]);
      setValentineProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [items]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleQuickAdd = (product: Product) => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.finalPrice,
      image: product.images?.[0]?.imageUrl || '/oralogo.png',
      quantity: 1,
    });

    // Show notification
    showNotification({
      productId: product.id,
      productName: product.name,
      productImage: product.images?.[0]?.imageUrl || '/oralogo.png',
      productPrice: product.finalPrice,
      quantity: 1,
    });
  };

  if (isLoading) {
    return null;
  }

  const hasValentineProducts = valentineProducts.length > 0;
  const hasRelatedProducts = relatedProducts.length > 0;

  if (!hasValentineProducts && !hasRelatedProducts) {
    return null;
  }

  return (
    <div className="space-y-12 mt-12 sm:mt-16">
      {/* ========================================================================
          "PERFECT VALENTINE ADD-ONS" SECTION
          ======================================================================== */}
      {hasValentineProducts && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-[#FFF5F7] via-[#FFEBF0] to-[#FFF0F3] rounded-2xl px-4 sm:px-8 py-8 sm:py-12 border border-[#FFD6E8]/50"
        >
          <div className="mb-8">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-medium text-text-primary mb-2">
              Perfect Valentine Add-Ons
            </h3>
            <p className="text-sm sm:text-base text-text-secondary">
              Curated gifts and tumblers to complete your collection
            </p>
          </div>

          {/* Mobile: Horizontal Scroll */}
          <div className="overflow-x-auto sm:hidden pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-4 min-w-min">
              {valentineProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickAdd={handleQuickAdd}
                  isMobile
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
            {valentineProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickAdd={handleQuickAdd}
                index={idx}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* ========================================================================
          "YOU MAY ALSO LIKE" SECTION
          ======================================================================== */}
      {hasRelatedProducts && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-medium text-text-primary mb-2">
                You May Also Like
              </h3>
              <p className="text-sm sm:text-base text-text-secondary">
                Handpicked recommendations for you
              </p>
            </div>
            <Link
              href="/collections"
              className="hidden sm:flex items-center gap-2 text-accent font-medium text-sm hover:gap-3 transition-all hover:text-accent/80"
            >
              <span>View all</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile: Horizontal Scroll */}
          <div className="overflow-x-auto sm:hidden pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-4 min-w-min">
              {relatedProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickAdd={handleQuickAdd}
                  isMobile
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickAdd={handleQuickAdd}
                index={idx}
              />
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

// ============================================================================
// PRODUCT CARD COMPONENT - Premium styling with ORA brand colors
// ============================================================================

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  isMobile?: boolean;
  index?: number;
}

function ProductCard({ product, onQuickAdd, isMobile, index = 0 }: ProductCardProps) {
  const primaryImage = product.images?.[0];
  const hasDiscount = (product.discountPercent ?? 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -6 }}
      className={`group relative overflow-hidden rounded-2xl border border-[#FFD6E8] bg-white transition-all duration-300 hover:shadow-[0_12px_32px_rgba(155,44,70,0.12)] ${
        isMobile ? 'w-56 flex-shrink-0' : ''
      }`}
    >
      {/* ========================================================================
          PRODUCT IMAGE CONTAINER
          ======================================================================== */}
      <div className="relative h-56 sm:h-64 bg-gradient-to-br from-[#FFF5F7] via-[#FFEBF0] to-[#FFF0F3] overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes={isMobile ? '224px' : '100%'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#FFD6E5]">
            <ShoppingBag className="w-16 h-16" strokeWidth={1.5} />
          </div>
        )}

        {/* Discount Badge - Premium style */}
        {hasDiscount && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute top-3 right-3 px-2.5 py-1 bg-accent text-white rounded-full text-xs font-bold shadow-md"
          >
            -{product.discountPercent}% off
          </motion.div>
        )}

        {/* Wishlist Heart Button */}
        <button className="absolute top-3 left-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:bg-accent hover:text-white shadow-sm opacity-0 group-hover:opacity-100">
          <Heart className="w-5 h-5 stroke-current fill-none" strokeWidth={1.5} />
        </button>
      </div>

      {/* ========================================================================
          PRODUCT INFO
          ======================================================================== */}
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        {/* Product Name */}
        <div>
          <h4 className="text-sm sm:text-base font-medium text-text-primary line-clamp-2 group-hover:text-accent transition-colors">
            {product.name}
          </h4>
        </div>

        {/* Price Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg sm:text-xl font-bold text-accent">
              ₹{product.finalPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-text-muted/60 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button - Premium CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onQuickAdd(product)}
          className="w-full py-3 px-4 bg-gradient-to-r from-accent to-rose-600 text-white rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 group/btn shadow-md hover:shadow-lg hover:from-accent/90 hover:to-rose-700"
        >
          <ShoppingBag className="w-4 h-4 transition-transform group-hover/btn:scale-110" strokeWidth={2} />
          <span>Add to Cart</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
