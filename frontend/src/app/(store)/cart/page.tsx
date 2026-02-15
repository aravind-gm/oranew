'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — PREMIUM CART PAGE
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * Inspired by GIVA, Tanishq, and premium e-commerce experiences.
 * Clean, luxurious feel with focus on trust and conversion.
 * 
 * KEY FEATURES:
 * ✓ Two-column layout (desktop) with sticky summary
 * ✓ Premium product cards with larger images
 * ✓ Smooth quantity animations
 * ✓ "You may also like" recommendations
 * ✓ Illustrated empty state
 * ✓ Mobile-first responsive design
 * ✓ Sticky mobile checkout bar
 */

import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/cartStore';
import { trackViewCart } from '@/lib/analytics';
import RelatedProductsCart from '@/components/RelatedProductsCart';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Minus, Plus, ShoppingBag, Trash2, Shield, Truck, Package, Heart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

// Shipping is always free for all orders
const TAX_INCLUDED = true;

// ============================================================================
// QUANTITY EDITOR COMPONENT
// ============================================================================

interface QuantityEditorProps {
  quantity: number;
  productId: string;
  onUpdate: (productId: string, newQuantity: number) => void;
  maxQuantity?: number;
}

function QuantityEditor({ quantity, productId, onUpdate, maxQuantity = 10 }: QuantityEditorProps) {
  const handleIncrement = () => {
    const newQty = Math.min(quantity + 1, maxQuantity);
    onUpdate(productId, newQty);
  };

  const handleDecrement = () => {
    const newQty = Math.max(quantity - 1, 1);
    onUpdate(productId, newQty);
  };

  return (
    <div className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden bg-white">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleDecrement}
        disabled={quantity <= 1}
        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-4 h-4" />
      </motion.button>
      
      <motion.span 
        key={quantity}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-12 text-center font-semibold text-gray-900"
      >
        {quantity}
      </motion.span>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleIncrement}
        disabled={quantity >= maxQuantity}
        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// ============================================================================
// CART ITEM CARD COMPONENT
// ============================================================================

interface CartItemCardProps {
  item: {
    id: string;
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    stockQuantity?: number;
  };
  onQuantityUpdate: (productId: string, newQuantity: number) => void;
  onRemove: (productId: string) => void;
  index: number;
}

function CartItemCard({ item, onQuantityUpdate, onRemove, index }: CartItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      <div className="flex gap-4 p-4 sm:p-5">
        {/* Product Image */}
        <Link 
          href={`/products/${item.productId}`}
          className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50"
        >
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 96px, 128px"
          />
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link 
                href={`/products/${item.productId}`}
                className="font-semibold text-gray-900 hover:text-pink-600 transition-colors line-clamp-2 text-sm sm:text-base"
              >
                {item.name}
              </Link>
              
              {/* Stock Status */}
              {item.stockQuantity !== undefined && (
                <p className={`text-xs mt-1 ${item.stockQuantity > 5 ? 'text-emerald-600' : item.stockQuantity > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {item.stockQuantity > 5 
                    ? '✓ In Stock' 
                    : item.stockQuantity > 0 
                      ? `Only ${item.stockQuantity} left!`
                      : '✕ Out of Stock'}
                </p>
              )}
            </div>

            {/* Remove Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onRemove(item.productId)}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Price & Quantity Row */}
          <div className="mt-auto pt-3 flex items-center justify-between gap-3">
            <QuantityEditor
              quantity={item.quantity}
              productId={item.productId}
              onUpdate={onQuantityUpdate}
              maxQuantity={item.stockQuantity || 10}
            />
            
            <motion.div 
              key={item.price * item.quantity}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-right"
            >
              <p className="font-bold text-lg sm:text-xl text-gray-900">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </p>
              {item.quantity > 1 && (
                <p className="text-xs text-gray-500">
                  ₹{item.price.toLocaleString('en-IN')} each
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// EMPTY CART COMPONENT
// ============================================================================

function EmptyCart() {
  return (
    <main className="bg-gradient-to-b from-white to-pink-50/30 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Illustrated Empty State */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full animate-pulse" />
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-16 h-16 text-pink-300" strokeWidth={1.5} />
            </div>
            {/* Decorative Elements */}
            <motion.div 
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-2 -right-2 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"
            >
              <Heart className="w-4 h-4 text-amber-500" />
            </motion.div>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl text-gray-900 mb-4">
            Your Cart is Empty
          </h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Looks like you haven&apos;t added any beautiful pieces yet. Explore our curated collections and find something special.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <span>Explore Collection</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:border-pink-300 hover:bg-pink-50 transition-all"
            >
              <Heart className="w-5 h-5" />
              <span>View Wishlist</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

// ============================================================================
// TRUST BADGES COMPONENT
// ============================================================================

function TrustBadges() {
  return (
    <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-full flex items-center justify-center">
          <Truck className="w-5 h-5 text-emerald-600" />
        </div>
        <p className="text-xs text-gray-600 font-medium">Free Delivery</p>
      </div>
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-2 bg-blue-50 rounded-full flex items-center justify-center">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-xs text-gray-600 font-medium">Easy Returns</p>
      </div>
      <div className="text-center">
        <div className="w-10 h-10 mx-auto mb-2 bg-amber-50 rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-600" />
        </div>
        <p className="text-xs text-gray-600 font-medium">Secure Payment</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CART PAGE COMPONENT
// ============================================================================

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, validateStock, stockErrors, stockValidating } = useCartStore();
  const { isAuthenticated } = useAuth();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ====== PRICING CALCULATIONS ======
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const shippingCost = 0; // Free delivery for all orders

  const total = useMemo(() => {
    return subtotal + shippingCost;
  }, [subtotal, shippingCost]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // ====== ANALYTICS: view_cart ======
  useEffect(() => {
    if (items.length > 0) {
      trackViewCart({
        items: items.map((item) => ({
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: subtotal,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fire once on page load

  // ====== STOCK VALIDATION ======
  useEffect(() => {
    if (items.length > 0) {
      validateStock();
    }
  }, [items.length, validateStock]);

  // ====== HANDLERS ======
  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    try {
      const stockResults = await validateStock();
      const hasStockIssues = stockResults.some(s => !s.isAvailable);

      if (hasStockIssues) {
        setIsCheckingOut(false);
        return;
      }

      if (!isAuthenticated) {
        router.push('/auth/login?redirect=/checkout');
        return;
      }
      
      router.push('/checkout');
    } catch (error) {
      console.error('Checkout error:', error);
      setIsCheckingOut(false);
    }
  };

  // ====== EMPTY STATE ======
  if (items.length === 0) {
    return <EmptyCart />;
  }

  // ====== MAIN RENDER ======
  return (
    <main className="bg-gradient-to-b from-white to-gray-50/50 min-h-screen pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* ============================================================
            PAGE HEADER
            ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-10"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-pink-600 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Shopping Cart</span>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-gray-900">
              Shopping Cart
            </h1>
            <span className="text-gray-500 text-sm sm:text-base">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
        </motion.div>

        {/* ============================================================
            STOCK ERRORS (if any)
            ============================================================ */}
        <AnimatePresence>
          {stockErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-sm font-semibold text-red-800 mb-1">Stock Issue</p>
              {stockErrors.map((error, i) => (
                <p key={i} className="text-sm text-red-600">{error}</p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            MAIN CONTENT - Two Column Layout
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map((item, index) => (
                <CartItemCard
                  key={item.productId}
                  item={item}
                  onQuantityUpdate={handleQuantityUpdate}
                  onRemove={handleRemoveItem}
                  index={index}
                />
              ))}
            </AnimatePresence>

            {/* Continue Shopping Link */}
            <Link 
              href="/collections"
              className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium mt-4 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Continue Shopping
            </Link>
          </div>

          {/* RIGHT: Order Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-28">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="font-semibold text-lg text-gray-900 mb-6">Order Summary</h2>

                {/* Price Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                    <span className="font-medium text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-gray-400">—</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST</span>
                    <span className="text-gray-500 text-xs">Included in price</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-emerald-600 font-medium">FREE</span>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-100 mt-6 pt-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-gray-900 font-semibold">Total</span>
                    <motion.span 
                      key={total}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold text-gray-900"
                    >
                      ₹{total.toLocaleString('en-IN')}
                    </motion.span>
                  </div>
                </div>

                {/* Checkout Button - Desktop */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  disabled={isCheckingOut || stockErrors.length > 0 || stockValidating}
                  className="hidden lg:flex w-full mt-6 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold hover:from-pink-700 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Secure Checkout
                    </>
                  )}
                </motion.button>

                {/* Trust Badges */}
                <TrustBadges />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          RELATED PRODUCTS - "You May Also Like"
          ============================================================ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RelatedProductsCart />
      </div>

      {/* ============================================================
          MOBILE STICKY CHECKOUT BAR
          ============================================================ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-4">
          {/* Total Display */}
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{total.toLocaleString('en-IN')}
            </p>
          </div>
          
          {/* Checkout Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleCheckout}
            disabled={isCheckingOut || stockErrors.length > 0 || stockValidating}
            className="flex-1 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCheckingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Checkout</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
