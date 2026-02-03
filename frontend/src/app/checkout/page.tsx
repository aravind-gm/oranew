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
import { getStateNames, getDistrictsByState, validatePhoneNumber, validatePincode } from '@/lib/addressData';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Lock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  district: string;
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
    fullName: '',
    email: '',
    phone: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    district: '',
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
    setAddress(prev => {
      const updated = { ...prev, [name]: value };
      // When state changes, clear district
      if (name === 'state') {
        updated.district = '';
      }
      return updated;
    });
    setError(null);
  };

  const handleAddressComplete = () => {
    // Validate required fields
    if (!address.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    
    if (!address.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      setError('Valid email is required');
      return;
    }

    if (!address.phone.trim() || !validatePhoneNumber(address.phone)) {
      setError('Valid 10-digit phone number is required');
      return;
    }

    if (!address.street || !address.city || !address.state || !address.district || !address.zipCode) {
      setError('Please fill in all address fields');
      return;
    }

    if (!validatePincode(address.zipCode)) {
      setError('Pincode must be 6 digits');
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
              <div className="space-y-6">
                {/* Contact Section */}
                <div className="pb-6 border-b border-border/20">
                  <h4 className="text-sm font-semibold text-text-primary mb-5 uppercase tracking-wide">Contact Information</h4>
                  
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                        Full Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={address.fullName}
                        onChange={handleAddressChange}
                        placeholder="Enter your full name"
                        autoFocus
                        className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                        Email Address <span className="text-error">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={address.email}
                        onChange={handleAddressChange}
                        placeholder="your.email@example.com"
                        className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                      />
                      <p className="text-xs text-text-muted mt-1">Order confirmation will be sent here</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                        Phone Number <span className="text-error">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={address.phone}
                        onChange={handleAddressChange}
                        placeholder="9876543210"
                        inputMode="numeric"
                        maxLength={10}
                        className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                      />
                      <p className="text-xs text-text-muted mt-1">10-digit mobile number for delivery updates</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Address Section */}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-5 uppercase tracking-wide">Delivery Address</h4>
                  
                  <div className="space-y-4">
                    {/* Street Address */}
                    <div>
                      <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                        Address Line 1 <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={address.street}
                        onChange={handleAddressChange}
                        placeholder="e.g., 123 Main Street, Apartment 4"
                        className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                      />
                    </div>

                    {/* Street 2 */}
                    <div>
                      <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                        Address Line 2 <span className="text-text-muted text-[10px]">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        name="street2"
                        value={address.street2 || ''}
                        onChange={handleAddressChange}
                        placeholder="e.g., Building name, Floor number"
                        className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                      />
                    </div>

                    {/* State & District Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* State Dropdown */}
                      <div>
                        <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                          State <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="state"
                            value={address.state}
                            onChange={handleAddressChange}
                            className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors min-h-[48px] appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 12px center',
                              paddingRight: '32px',
                            }}
                          >
                            <option value="">Select state</option>
                            {getStateNames().map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* District Dropdown */}
                      <div>
                        <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                          District <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <select
                            name="district"
                            value={address.district}
                            onChange={handleAddressChange}
                            disabled={!address.state}
                            className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent transition-colors min-h-[48px] appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-white/50"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 12px center',
                              paddingRight: '32px',
                            }}
                          >
                            <option value="">{address.state ? 'Select district' : 'Select state first'}</option>
                            {address.state && getDistrictsByState(address.state).map(district => (
                              <option key={district.name} value={district.name}>{district.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* City & Pincode Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* City */}
                      <div>
                        <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                          City / Town <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={address.city}
                          onChange={handleAddressChange}
                          placeholder="e.g., Mumbai, Delhi, Bangalore"
                          className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                        />
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-xs text-text-muted uppercase tracking-wide mb-2 font-semibold">
                          Pincode <span className="text-error">*</span>
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={address.zipCode}
                          onChange={handleAddressChange}
                          placeholder="e.g., 400001"
                          inputMode="numeric"
                          maxLength={6}
                          className="w-full px-4 py-3.5 bg-background-white border-2 border-border/30 rounded-lg text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors min-h-[48px]"
                        />
                        <p className="text-xs text-text-muted mt-1">6-digit postal code</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddressComplete}
                  className="mt-8 w-full py-4 bg-accent text-white rounded-full text-base font-semibold hover:bg-accent/90 transition-all min-h-[52px] shadow-md hover:shadow-lg"
                >
                  Proceed to Payment
                </motion.button>
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
                  {/* Contact Info Receipt */}
                  <div className="p-5 bg-gradient-to-br from-accent/5 via-accent/3 to-transparent rounded-xl border border-accent/20">
                    <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-4">
                      ✓ Contact Information
                    </p>
                    <div className="text-sm text-text-primary space-y-2.5">
                      <p><span className="text-text-muted font-medium">Name:</span> {address.fullName}</p>
                      <p><span className="text-text-muted font-medium">Email:</span> {address.email}</p>
                      <p><span className="text-text-muted font-medium">Phone:</span> {address.phone}</p>
                    </div>
                  </div>

                  {/* Address Receipt */}
                  <div className="p-5 bg-gradient-to-br from-accent/5 via-accent/3 to-transparent rounded-xl border border-accent/20">
                    <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-4">
                      ✓ Shipping Address
                    </p>
                    <div className="text-sm text-text-primary space-y-1.5">
                      <p className="font-medium">{address.street}</p>
                      {address.street2 && <p>{address.street2}</p>}
                      <p>{address.city}, {address.district}</p>
                      <p>{address.state} {address.zipCode}</p>
                      <p className="text-text-muted">{address.country}</p>
                    </div>
                    <motion.button
                      whileHover={{ x: -4 }}
                      onClick={() => setCurrentStep('contact')}
                      className="mt-4 text-sm text-accent hover:text-accent/80 font-semibold transition-colors flex items-center gap-1"
                    >
                      ← Edit address
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeliveryConfirm}
                    className="w-full py-4 bg-accent text-white rounded-full text-base font-semibold hover:bg-accent/90 transition-all min-h-[52px] shadow-md hover:shadow-lg"
                  >
                    Continue to Payment
                  </motion.button>
                </div>
              ) : (
                <p className="text-sm text-text-muted py-8 text-center">Please fill address first</p>
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
                    <p className="text-xs text-text-muted uppercase tracking-wide font-semibold mb-4">
                      Select Payment Method
                    </p>
                    <motion.label
                      whileHover={{ borderColor: '#9B2C46' }}
                      className="flex items-center gap-4 p-5 border-2 border-border/30 rounded-xl cursor-pointer hover:bg-accent/5 transition-all min-h-[72px]"
                    >
                      <input type="radio" name="payment" value="razorpay" defaultChecked className="w-5 h-5 accent-accent cursor-pointer" />
                      <div className="flex-1">
                        <p className="text-base font-semibold text-text-primary">Razorpay Payments</p>
                        <p className="text-xs text-text-muted mt-1">💳 Card • 🏦 UPI • 🏪 Netbanking • 🪙 Wallets</p>
                      </div>
                      <div className="text-accent text-2xl">→</div>
                    </motion.label>
                  </div>

                  {/* Security Trust Badge */}
                  <div className="flex items-center justify-center gap-6 py-6 px-4 bg-accent/5 rounded-xl border border-accent/20">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔒</div>
                      <p className="text-xs text-text-muted">SSL Encrypted</p>
                    </div>
                    <div className="w-px h-12 bg-border/30" />
                    <div className="text-center">
                      <div className="text-2xl mb-1">✓</div>
                      <p className="text-xs text-text-muted">Secure Payment</p>
                    </div>
                  </div>

                  {/* Desktop Place Order - Hidden on mobile */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="hidden sm:flex w-full py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-3 min-h-[52px] shadow-md hover:shadow-lg text-base"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        <span>Complete Purchase</span>
                      </>
                    )}
                  </motion.button>

                  <p className="hidden sm:block text-center text-xs text-text-muted">
                    Your payment is encrypted & processed securely by Razorpay
                  </p>
                </div>
              ) : (
                <p className="text-sm text-text-muted py-8 text-center">Complete delivery confirmation first</p>
              )}
            </CollapsibleSection>

          </div>

          {/* ============================================================
              RIGHT: ORDER SUMMARY - Hidden on mobile, shown below on tablet+
              ============================================================ */}
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="space-y-6 bg-gradient-to-br from-accent/5 via-transparent to-accent/3 rounded-2xl p-6 border border-accent/20">
              
              {/* Summary Header */}
              <div>
                <p className="text-xs uppercase tracking-widest text-text-muted font-semibold mb-4">
                  Order Summary
                </p>
              </div>

              {/* Items Preview */}
              <div className="space-y-3 pb-4 border-b border-border/20">
                {items.map((item) => (
                  <motion.div 
                    key={item.productId} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-border/20 shadow-sm">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                      <p className="text-xs text-text-muted">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-text-primary whitespace-nowrap">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary font-medium">₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-success text-xs font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax</span>
                  <span className="text-text-muted text-xs">Included</span>
                </div>
                
                <div className="pt-3 border-t-2 border-accent/30 mt-3">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-text-primary font-semibold">Total</span>
                    <span className="text-2xl font-bold text-accent">
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
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-border/20 px-4 py-3 z-50 safe-area-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.1)]"
        >
          <div className="flex items-center gap-3">
            {/* Total Display */}
            <div className="flex-1">
              <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">Total</p>
              <p className="text-lg font-bold text-accent">
                ₹{totalPrice.toLocaleString('en-IN')}
              </p>
            </div>
            
            {/* Place Order Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateOrder}
              disabled={loading}
              className="flex-1 py-3.5 bg-accent text-white rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay Now</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </main>
  );
}
