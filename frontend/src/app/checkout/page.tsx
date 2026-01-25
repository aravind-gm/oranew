'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — PROGRESSIVE CHECKOUT FLOW
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * This is NOT a traditional checkout form. This is a progressive disclosure system.
 * Think: Stripe checkout experience, Linear payment flow, Apple order confirmation
 * 
 * CORE PRINCIPLES:
 * ✓ Progressive disclosure (one section at a time)
 * ✓ Inline, calm inputs (no form dump)
 * ✓ Receipt-style confirmations
 * ✓ System stepper (Cart → Address → Payment)
 * ✓ Minimal payment UI (no logo grids)
 * 
 * FORBIDDEN PATTERNS:
 * ✗ Multi-column form layouts
 * ✗ Boxed sections everywhere
 * ✗ Traditional checkout steps on separate pages
 * ✗ Payment provider logo grids
 * ✗ Overwhelming form fields at once
 * 
 * This is a complete rebuild from first principles.
 */

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface CheckoutSection {
  id: 'contact' | 'delivery' | 'payment';
  title: string;
  isComplete: boolean;
}

// ============================================================================
// SYSTEM STEPPER COMPONENT
// ============================================================================

const CHECKOUT_STEPS = [
  { id: 'cart', label: 'Cart' },
  { id: 'address', label: 'Address' },
  { id: 'payment', label: 'Payment' },
];

function SystemStepper({ currentStep = 'address' }: { currentStep?: string }) {
  const currentIndex = CHECKOUT_STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center gap-2 mb-6 sm:mb-12">
      {CHECKOUT_STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <span
            className={`text-[10px] sm:text-xs tracking-wider transition-colors ${
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
            <span className="mx-2 sm:mx-3 text-text-muted">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// COLLAPSIBLE SECTION COMPONENT
// ============================================================================

interface CollapsibleSectionProps {
  section: CheckoutSection;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ section, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        onClick={onToggle}
        className="w-full py-4 sm:py-6 flex items-center justify-between group hover:bg-primary/5 transition-colors min-h-[56px]"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {section.isComplete && (
            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          <h2 className="text-base sm:text-lg font-medium text-text-primary">{section.title}</h2>
        </div>
        
        <div className="text-text-muted p-2 -mr-2">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-6 sm:pb-8 px-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CheckoutPage() {
  const router = useRouter();
  const { token, isHydrated } = useAuthStore();
  const { items, totalPrice } = useCartStore();

  // ====== STATE ======
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentStep, setCurrentStep] = useState<'contact' | 'delivery' | 'payment'>('contact');
  
  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  const [sections, setSections] = useState<CheckoutSection[]>([
    { id: 'contact', title: 'Contact & Address', isComplete: false },
    { id: 'delivery', title: 'Delivery Confirmation', isComplete: false },
    { id: 'payment', title: 'Payment', isComplete: false },
  ]);

  // ====== AUTH CHECK ======
  useEffect(() => {
    if (isHydrated && !token) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [isHydrated, token, router]);

  // ====== CART CHECK ======
  useEffect(() => {
    if (items.length === 0) {
      router.push('/products');
    }
  }, [items.length, router]);

  // ====== HANDLERS ======
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressComplete = () => {
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      setError('Please fill in all address fields');
      return;
    }
    
    setSections(prev => prev.map(s => 
      s.id === 'contact' ? { ...s, isComplete: true } : s
    ));
    setCurrentStep('delivery');
    setError(null);
  };

  const handleDeliveryConfirm = () => {
    setSections(prev => prev.map(s => 
      s.id === 'delivery' ? { ...s, isComplete: true } : s
    ));
    setCurrentStep('payment');
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderItems = items.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
      }));

      const response = await api.post('/orders/checkout', {
        items: orderItems,
        shippingAddress: address,
        couponCode: null,
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create order');
      }

      const createdOrder = response.data.order || response.data.data;
      
      // Redirect to payment
      setTimeout(() => {
        router.push(`/checkout/payment?orderId=${createdOrder.id}`);
      }, 500);
    } catch (err: unknown) {
      let errorMessage = 'Failed to create order';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
        errorMessage = axiosErr.response?.data?.error?.message || 
                       axiosErr.message || 
                       'Server error occurred';
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // ====== LOADING STATE ======
  if (!isHydrated || !token || items.length === 0) {
    return null;
  }

  // ====== MAIN RENDER ======
  return (
    <main className="bg-background min-h-screen pb-32 sm:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 lg:py-16">
        
        {/* ============================================================
            HEADER - Mobile Optimized
            ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-text-primary mb-1">
            Secure Checkout
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            Complete your order
          </p>
        </motion.div>

        {/* ============================================================
            SYSTEM STEPPER
            ============================================================ */}
        <SystemStepper currentStep={currentStep === 'contact' ? 'address' : 'payment'} />

        {/* ============================================================
            ERROR DISPLAY
            ============================================================ */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 sm:mb-8 p-3 sm:p-4 bg-error/10 border border-error/20 rounded-lg"
            >
              <p className="text-sm text-error">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-12">
          
          {/* ============================================================
              LEFT: PROGRESSIVE SECTIONS
              ============================================================ */}
          <div>
            
            {/* SECTION 1: Contact & Address */}
            <CollapsibleSection
              section={sections[0]}
              isExpanded={currentStep === 'contact'}
              onToggle={() => setCurrentStep('contact')}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-text-muted uppercase tracking-wide mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-3.5 sm:py-3 bg-background-white border border-border/40 rounded-lg text-base sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-colors min-h-[52px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wide mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      placeholder="Mumbai"
                      className="w-full px-4 py-3.5 sm:py-3 bg-background-white border border-border/40 rounded-lg text-base sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-colors min-h-[52px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wide mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      placeholder="Maharashtra"
                      className="w-full px-4 py-3.5 sm:py-3 bg-background-white border border-border/40 rounded-lg text-base sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-colors min-h-[52px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wide mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={address.zipCode}
                      onChange={handleAddressChange}
                      placeholder="400001"
                      className="w-full px-4 py-3.5 sm:py-3 bg-background-white border border-border/40 rounded-lg text-base sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-text-primary transition-colors min-h-[52px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted uppercase tracking-wide mb-2">
                      Country
                    </label>
                    <select
                      name="country"
                      value={address.country}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3.5 sm:py-3 bg-background-white border border-border/40 rounded-lg text-base sm:text-sm text-text-primary focus:outline-none focus:border-text-primary transition-colors min-h-[52px]"
                    >
                      <option value="India">India</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAddressComplete}
                  className="mt-6 w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-text-primary text-background rounded-full text-sm font-medium hover:bg-text-secondary transition-colors min-h-[48px]"
                >
                  Continue to Delivery
                </button>
              </div>
            </CollapsibleSection>

            {/* SECTION 2: Delivery Confirmation */}
            <CollapsibleSection
              section={sections[1]}
              isExpanded={currentStep === 'delivery'}
              onToggle={() => sections[0].isComplete && setCurrentStep('delivery')}
            >
              {sections[0].isComplete ? (
                <div className="space-y-6">
                  {/* Address Receipt Line */}
                  <div className="p-3 sm:p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                      Shipping to
                    </p>
                    <div className="text-sm text-text-primary space-y-1">
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state} {address.zipCode}</p>
                      <p>{address.country}</p>
                    </div>
                    <button
                      onClick={() => setCurrentStep('contact')}
                      className="mt-3 text-xs text-accent hover:underline p-1 -ml-1"
                    >
                      Edit address
                    </button>
                  </div>

                  <button
                    onClick={handleDeliveryConfirm}
                    className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-text-primary text-background rounded-full text-sm font-medium hover:bg-text-secondary transition-colors min-h-[48px]"
                  >
                    Confirm Delivery
                  </button>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Complete address first</p>
              )}
            </CollapsibleSection>

            {/* SECTION 3: Payment */}
            <CollapsibleSection
              section={sections[2]}
              isExpanded={currentStep === 'payment'}
              onToggle={() => sections[1].isComplete && setCurrentStep('payment')}
            >
              {sections[1].isComplete ? (
                <div className="space-y-6">
                  {/* Payment Method Selection */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border border-border/40 rounded-lg cursor-pointer hover:border-text-primary transition-colors min-h-[60px]">
                      <input type="radio" name="payment" value="razorpay" defaultChecked className="w-5 h-5 sm:w-4 sm:h-4" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">Razorpay</p>
                        <p className="text-xs text-text-muted">Card, UPI, Netbanking, Wallets</p>
                      </div>
                    </label>
                  </div>

                  {/* Desktop Place Order - Hidden on mobile */}
                  <button
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="hidden sm:flex w-full py-4 bg-text-primary text-background rounded-full font-medium hover:bg-text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 min-h-[52px]"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Place Secure Order</span>
                      </>
                    )}
                  </button>

                  <p className="hidden sm:block text-center text-xs text-text-muted">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-muted">Complete delivery confirmation first</p>
              )}
            </CollapsibleSection>

          </div>

          {/* ============================================================
              RIGHT: ORDER SUMMARY - Hidden on mobile, shown below on tablet+
              ============================================================ */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-6">
              
              {/* Summary Header */}
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted mb-4">
                  Order Summary
                </p>
              </div>

              {/* Items Preview */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-background-white border border-border/30">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary truncate">{item.name}</p>
                      <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs text-text-primary font-medium">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="pt-4 border-t border-border/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-text-muted text-xs">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax</span>
                  <span className="text-text-muted text-xs">Included</span>
                </div>
                
                <div className="pt-3 border-t border-text-primary/40">
                  <div className="flex justify-between">
                    <span className="text-text-primary font-medium">Total</span>
                    <span className="text-lg font-medium text-text-primary">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </aside>

        </div>

      </div>

      {/* ============================================================
          MOBILE STICKY PLACE ORDER BAR
          ============================================================ */}
      {currentStep === 'payment' && sections[1].isComplete && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50 safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3">
            {/* Total Display */}
            <div className="flex-1">
              <p className="text-xs text-text-muted">Total</p>
              <p className="text-lg font-bold text-text-primary">
                ₹{totalPrice.toLocaleString('en-IN')}
              </p>
            </div>
            
            {/* Place Order Button */}
            <button
              onClick={handleCreateOrder}
              disabled={loading}
              className="flex-1 py-3.5 bg-text-primary text-background rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  <span>Processing</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
