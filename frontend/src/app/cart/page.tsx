'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — LIVE ORDER INVOICE
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * This is NOT a shopping cart. This is a live invoice being prepared.
 * Think: Apple order receipt, Stripe checkout summary, Linear billing UI
 * 
 * CORE PRINCIPLES:
 * ✓ Live invoice rows (not product cards)
 * ✓ Inline quantity editing (text input + subtle steppers)
 * ✓ Receipt-style price breakdown (no boxes)
 * ✓ System stepper (Cart → Address → Payment)
 * ✓ Calm, editorial, premium feel
 * 
 * FORBIDDEN PATTERNS:
 * ✗ Traditional cart cards
 * ✗ Boxed order summaries
 * ✗ Left/right split layouts
 * ✗ Loud animations
 * ✗ Old e-commerce patterns
 * 
 * This is a complete rebuild from first principles.
 */

import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const SHIPPING_THRESHOLD = 999;
const TAX_INCLUDED = true; // Tax is included in price

// ============================================================================
// COMPONENTS — INLINE QUANTITY EDITOR
// ============================================================================

interface QuantityEditorProps {
  quantity: number;
  productId: string;
  onUpdate: (productId: string, newQuantity: number) => void;
  maxQuantity?: number;
}

/**
 * Inline quantity editor with subtle stepper controls
 * Designed to look like an editable invoice line, not a shopping UI
 */
function QuantityEditor({ quantity, productId, onUpdate, maxQuantity = 10 }: QuantityEditorProps) {
  const [localValue, setLocalValue] = useState(quantity.toString());
  const [isFocused, setIsFocused] = useState(false);

  const handleIncrement = () => {
    const newQty = Math.min(quantity + 1, maxQuantity);
    onUpdate(productId, newQty);
    setLocalValue(newQty.toString());
  };

  const handleDecrement = () => {
    const newQty = Math.max(quantity - 1, 1);
    onUpdate(productId, newQty);
    setLocalValue(newQty.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = parseInt(localValue);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= maxQuantity) {
      onUpdate(productId, parsed);
    } else {
      setLocalValue(quantity.toString());
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDecrement}
        disabled={quantity <= 1}
        className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3 h-3" />
      </button>
      
      <input
        type="text"
        value={localValue}
        onChange={handleInputChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleInputBlur}
        className={`w-12 text-center text-sm bg-transparent border-b transition-all ${
          isFocused ? 'border-text-primary' : 'border-transparent'
        } focus:outline-none`}
      />
      
      <button
        onClick={handleIncrement}
        disabled={quantity >= maxQuantity}
        className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ============================================================================
// COMPONENTS — ANIMATED PRICE
// ============================================================================

interface AnimatedPriceProps {
  value: number;
  className?: string;
}

/**
 * Animated price component for smooth transitions
 * When price changes, the number animates subtly
 */
function AnimatedPrice({ value, className = '' }: AnimatedPriceProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      ₹{value.toLocaleString('en-IN')}
    </motion.span>
  );
}

// ============================================================================
// COMPONENTS — SYSTEM STEPPER
// ============================================================================

const CHECKOUT_STEPS = [
  { id: 'cart', label: 'Cart' },
  { id: 'address', label: 'Address' },
  { id: 'payment', label: 'Payment' },
];

function SystemStepper({ currentStep = 'cart' }: { currentStep?: string }) {
  const currentIndex = CHECKOUT_STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center gap-2 mb-12">
      {CHECKOUT_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <span
            className={`text-xs tracking-wider transition-colors ${
              index === currentIndex
                ? 'text-text-primary font-medium'
                : index < currentIndex
                ? 'text-text-secondary'
                : 'text-text-muted'
            }`}
          >
            {step.label}
          </span>
          {index < CHECKOUT_STEPS.length - 1 && (
            <span className="mx-3 text-text-muted">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, validateStock, stockErrors, stockValidating } = useCartStore();
  const { token } = useAuthStore();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);

  // ====== PRICING CALCULATIONS ======
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const shippingCost = useMemo(() => {
    return subtotal >= SHIPPING_THRESHOLD ? 0 : 0; // Free shipping
  }, [subtotal]);

  const total = useMemo(() => {
    return subtotal + shippingCost;
  }, [subtotal, shippingCost]);

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  // ====== STOCK VALIDATION ======
  useEffect(() => {
    if (items.length > 0) {
      validateStock();
    }
  }, [items.length, validateStock]);

  // ====== QUANTITY UPDATE HANDLER ======
  const handleQuantityUpdate = (productId: string, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
    
    // Brief highlight effect on the updated row
    setHighlightedItem(productId);
    setTimeout(() => setHighlightedItem(null), 800);
  };

  // ====== REMOVE ITEM HANDLER ======
  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  // ====== CHECKOUT HANDLER ======
  const handleCheckout = async () => {
    setIsCheckingOut(true);
    
    try {
      const stockResults = await validateStock();
      const hasStockIssues = stockResults.some(s => !s.isAvailable);

      if (hasStockIssues) {
        setIsCheckingOut(false);
        return;
      }

      if (!token) {
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
    return (
      <main className="bg-background min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <ShoppingBag className="w-12 h-12 text-text-muted/40 mx-auto mb-6" />
            <h1 className="font-serif text-3xl lg:text-4xl text-text-primary mb-3">
              Your cart is empty
            </h1>
            <p className="text-text-secondary mb-10">
              Discover our curated collections
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-8 py-3 bg-text-primary text-background rounded-full hover:bg-text-secondary transition-colors"
            >
              <span>Browse Collections</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  // ====== MAIN RENDER ======
  return (
    <main className="bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        
        {/* ============================================================
            HEADER
            ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-serif text-3xl lg:text-4xl text-text-primary mb-1">
            Your Order
          </h1>
          <p className="text-sm text-text-secondary">
            Review before checkout
          </p>
        </motion.div>

        {/* ============================================================
            SYSTEM STEPPER
            ============================================================ */}
        <SystemStepper currentStep="cart" />

        {/* ============================================================
            STOCK ERRORS (if any)
            ============================================================ */}
        <AnimatePresence>
          {stockErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-4 bg-error/10 border border-error/20 rounded-lg"
            >
              <p className="text-xs font-medium text-error uppercase tracking-wide mb-2">
                Stock Issue
              </p>
              {stockErrors.map((error, i) => (
                <p key={i} className="text-sm text-error/80">
                  {error}
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================
            LIVE INVOICE ROWS
            ============================================================ */}
        <div className="mb-12">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-text-muted">
              Items ({itemCount})
            </p>
          </div>

          {/* Invoice table header - subtle */}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 pb-2 border-b border-border/40 mb-2">
            <p className="text-xs text-text-muted uppercase tracking-wide">Product</p>
            <p className="text-xs text-text-muted uppercase tracking-wide text-center">Qty</p>
            <p className="text-xs text-text-muted uppercase tracking-wide text-right">Price</p>
            <div className="w-6" /> {/* Spacer for remove button */}
          </div>

          {/* Invoice rows */}
          <div className="space-y-0">
            {items.map((item, index) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  backgroundColor: highlightedItem === item.productId 
                    ? 'rgba(255, 214, 232, 0.15)' 
                    : 'transparent'
                }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.03,
                }}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 py-4 border-b border-border/20 items-center hover:bg-primary/5 transition-colors"
              >
                {/* Product Info */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-background-white border border-border/30">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">
                      {item.name}
                    </p>
                    {item.stockQuantity !== undefined && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {item.stockQuantity > 0 
                          ? `${item.stockQuantity} in stock` 
                          : 'Out of stock'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quantity Editor */}
                <QuantityEditor
                  quantity={item.quantity}
                  productId={item.productId}
                  onUpdate={handleQuantityUpdate}
                  maxQuantity={item.stockQuantity || 10}
                />

                {/* Price */}
                <div className="text-right min-w-[80px]">
                  <AnimatedPrice 
                    value={item.price * item.quantity}
                    className="text-sm text-text-primary font-medium"
                  />
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item.productId)}
                  className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-error transition-colors"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ============================================================
            SMART BILL BREAKDOWN (Receipt Style - NO BOX)
            ============================================================ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 max-w-sm ml-auto"
        >
          {/* Subtotal */}
          <div className="flex justify-between items-baseline py-2 text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <AnimatedPrice value={subtotal} className="text-text-primary" />
          </div>

          {/* Shipping */}
          <div className="flex justify-between items-baseline py-2 text-sm">
            <span className="text-text-secondary">Shipping</span>
            <span className="text-text-muted text-xs">Free</span>
          </div>

          {/* Tax */}
          {TAX_INCLUDED && (
            <div className="flex justify-between items-baseline py-2 text-sm">
              <span className="text-text-secondary">Tax</span>
              <span className="text-text-muted text-xs">Included</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-text-primary/40 my-3" />

          {/* Total */}
          <div className="flex justify-between items-baseline py-1">
            <span className="text-text-primary font-medium">Total</span>
            <AnimatedPrice 
              value={total}
              className="text-xl font-medium text-text-primary"
            />
          </div>
        </motion.div>

        {/* ============================================================
            PRIMARY ACTION
            ============================================================ */}
        <div className="space-y-4">
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut || stockErrors.length > 0 || stockValidating}
            className="w-full py-4 bg-text-primary text-background rounded-full font-medium hover:bg-text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCheckingOut ? 'Preparing...' : 'Continue to Secure Checkout'}
          </button>

          {/* Micro Trust Line */}
          <p className="text-center text-xs text-text-muted">
            Secure checkout • Free shipping above ₹{SHIPPING_THRESHOLD.toLocaleString('en-IN')}
          </p>
        </div>

      </div>
    </main>
  );
}
