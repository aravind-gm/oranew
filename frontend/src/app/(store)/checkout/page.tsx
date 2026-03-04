'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — PREMIUM CHECKOUT PAGE
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY:
 * Clean, minimal, and trustworthy checkout experience.
 * Inspired by premium brands like Stripe, Apple, and GIVA.
 * 
 * KEY FEATURES:
 * ✓ Two-column layout (forms left, sticky summary right)
 * ✓ Progressive form sections with accordion
 * ✓ Premium input styling with better error states
 * ✓ Trust badges and secure messaging
 * ✓ Cross-sell recommendations before payment
 * ✓ Mobile-first responsive design
 */

import api from '@/lib/api';
import { getStateNames, getDistrictsByState, validatePhoneNumber, validatePincode } from '@/lib/addressData';
import { trackBeginCheckout, trackAddPaymentInfo, setEnhancedConversions } from '@/lib/analytics';
import { loadRazorpayScript } from '@/lib/razorpay';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { CheckoutSkeleton } from '@/components/checkout/SkeletonBlock';
import { TrustStrip, ReturnPolicyLine } from '@/components/checkout/TrustStrip';
import { CODBadge } from '@/components/checkout/CODBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Lock, Shield, Truck, CreditCard, AlertCircle, Package, BookmarkCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';

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

// (Step indicator removed — single-page checkout)

interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  addressType?: string | null;
}

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  maxLength?: number;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  autoFocus?: boolean;
}

function Input({ label, name, type = 'text', value, onChange, placeholder, required, error, hint, maxLength, inputMode, autoFocus }: InputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoFocus={autoFocus}
        className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
          error 
            ? 'border-red-300 focus:border-red-500 bg-red-50' 
            : 'border-gray-200 focus:border-pink-500 bg-white'
        }`}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

// ============================================================================
// SELECT COMPONENT
// ============================================================================

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

function Select({ label, name, value, onChange, options, placeholder, required, disabled, error }: SelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3.5 border-2 rounded-xl text-gray-900 focus:outline-none transition-all appearance-none cursor-pointer bg-no-repeat ${
          error
            ? 'border-red-300 focus:border-red-500 bg-red-50'
            : 'border-gray-200 focus:border-pink-500 bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 12px center',
          paddingRight: '40px',
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// ORDER SUMMARY COMPONENT
// ============================================================================

// Shipping is always FREE — backend is source of truth, frontend only displays
const SHIPPING_COST = 0;

function OrderSummary({ items, totalPrice }: { items: Array<{ productId: string; name: string; image: string; price: number; quantity: number }>; totalPrice: number }) {
  const displayTotal = totalPrice;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:sticky lg:top-28">
      <h2 className="font-semibold text-lg text-gray-900 mb-6">Order Summary</h2>

      {/* Items */}
      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3">
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-pink-50 border border-gray-100">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-cover"
                sizes="64px"
              />
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white rounded-full text-xs flex items-center justify-center font-medium">
                {item.quantity}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              ₹{(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="space-y-3 py-4 border-t border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">₹{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-emerald-600 font-medium">FREE</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="text-gray-500 text-xs">Included</span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-gray-900">₹{displayTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* COD Badge */}
      <div className="mt-4">
        <CODBadge enabled />
      </div>

      {/* Trust Strip */}
      <div className="mt-4">
        <TrustStrip />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CHECKOUT PAGE COMPONENT
// ============================================================================

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthStore();
  const { items, totalPrice } = useCartStore();

  // State
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [addressValid, setAddressValid] = useState(false);

  // Refs for auto-scroll-to-error
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  
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

  // Auth redirect — offer guest checkout option
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/checkout/guest');
    }
  }, [authLoading, user, router]);

  // Fetch saved addresses for logged-in users — auto-prefill default
  useEffect(() => {
    if (!user) return;
    // Prefill email from user account
    setAddress(prev => ({
      ...prev,
      email: prev.email || user.email || '',
      fullName: prev.fullName || user.fullName || '',
    }));
    api.get('/users/addresses')
      .then(res => {
        const addrs: SavedAddress[] = res.data?.data || [];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          // Auto-select default address (or first available)
          const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
          if (defaultAddr) {
            setAddress(prev => ({
              ...prev,
              fullName: defaultAddr.fullName || prev.fullName,
              phone: defaultAddr.phone || prev.phone,
              street: defaultAddr.addressLine1,
              street2: defaultAddr.addressLine2 || '',
              city: defaultAddr.city,
              state: defaultAddr.state,
              district: '',
              zipCode: defaultAddr.pincode,
              country: defaultAddr.country || 'India',
            }));
          }
          setShowSavedAddresses(false); // collapse since we auto-filled
        }
      })
      .catch(() => { /* silent — saved addresses are optional */ });
  }, [user]);

  // Empty cart redirect
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  const handleUseSavedAddress = (saved: SavedAddress) => {
    setAddress(prev => ({
      ...prev,
      fullName: saved.fullName,
      phone: saved.phone,
      street: saved.addressLine1,
      street2: saved.addressLine2 || '',
      city: saved.city,
      state: saved.state,
      district: '',
      zipCode: saved.pincode,
      country: saved.country || 'India',
    }));
    setShowSavedAddresses(false);
    setErrors({});
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'state') {
        updated.district = '';
      }
      return updated;
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateAddressForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!address.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!address.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!address.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\s|-/g, ''))) {
      newErrors.phone = 'Enter a valid Indian mobile number (10 digits, starting 6-9)';
    }

    if (!address.street.trim()) {
      newErrors.street = 'Address is required';
    } else if (address.street.trim().length < 10) {
      newErrors.street = 'Please enter a complete address (minimum 10 characters)';
    }

    if (!address.state) {
      newErrors.state = 'State is required';
    }

    if (!address.district) {
      newErrors.district = 'District is required';
    }

    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    } else if (address.city.trim().length < 3) {
      newErrors.city = 'Please enter a valid city name (minimum 3 characters)';
    }

    if (!address.zipCode.trim()) {
      newErrors.zipCode = 'Pincode is required';
    } else if (!validatePincode(address.zipCode)) {
      newErrors.zipCode = 'Please enter a valid 6-digit pincode';
    }

    setErrors(newErrors);

    // Auto-scroll to first error field
    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      const firstErrorField = errorKeys[0];
      const ref = fieldRefs.current[firstErrorField];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setAddressValid(false);
      return false;
    }

    setAddressValid(true);
    return true;
  }, [address]);

  // Validate address and scroll to payment section
  const handleValidateAndProceed = () => {
    if (validateAddressForm()) {
      // Analytics: begin_checkout
      trackBeginCheckout({
        items: items.map((item) => ({
          id: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total: totalPrice,
      });

      // Enhanced conversions: send hashed PII
      if (address.email || address.phone) {
        setEnhancedConversions({ email: address.email, phone: address.phone });
      }

      // Scroll to payment section
      paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isCODSelected = selectedPaymentMethod === 'cod';
  const COD_MAX_AMOUNT = 5000;
  const codEligible = totalPrice <= COD_MAX_AMOUNT;

  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
      }));

      const response = await api.post('/orders/checkout', {
        items: orderItems,
        shippingAddress: address,
        couponCode: null,
        paymentMethod: isCODSelected ? 'COD' : undefined,
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create order');
      }

      const createdOrder = response.data.order || response.data.data;

      // Analytics: add_payment_info
      trackAddPaymentInfo({
        orderId: createdOrder.id,
        total: totalPrice,
        paymentMethod: isCODSelected ? 'cod' : 'razorpay',
        items: items.map((item) => ({
          id: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      // COD: order is confirmed immediately — go to success
      if (response.data.codOrder) {
        const { clearCart } = useCartStore.getState();
        clearCart();
        router.push(`/checkout/success?orderNumber=${createdOrder.orderNumber}`);
        return;
      }

      // Online: open Razorpay modal directly (no extra page hop)
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please check your connection and try again.');
      }

      const paymentResponse = await api.post('/payments/create', { orderId: createdOrder.id });
      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.error?.message || 'Failed to create payment');
      }

      const { razorpayOrderId, razorpayKeyId, amount, currency } = paymentResponse.data;
      const keyId = razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) throw new Error('Razorpay key not configured.');

      if (!window.Razorpay) throw new Error('Razorpay not loaded');

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency: currency || 'INR',
        order_id: razorpayOrderId,
        name: 'ORA Jewellery',
        description: `Order #${createdOrder.id}`,
        handler: async (rzpResponse: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await api.post('/payments/verify', {
              orderId: createdOrder.id,
              razorpay_payment_id: rzpResponse.razorpay_payment_id,
              razorpay_order_id: rzpResponse.razorpay_order_id,
              razorpay_signature: rzpResponse.razorpay_signature,
            });
            if (!verifyRes.data.success) throw new Error('Payment verification failed');
            const { clearCart } = useCartStore.getState();
            clearCart();
            router.push(`/checkout/success?orderId=${createdOrder.id}`);
          } catch {
            setErrors({ submit: 'Payment verification failed. Please contact support.' });
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrors({ submit: 'Payment cancelled. Your order has been saved — you can retry.' });
          },
        },
        theme: { color: '#D4AF77' },
      });
      razorpay.open();
      // Keep loading=true while modal is open; it resets in handler/ondismiss
      return;
    } catch (err: unknown) {
      let errorMessage = 'Failed to create order';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
        errorMessage = axiosErr.response?.data?.error?.message || 'Server error occurred';
      }
      
      setErrors({ submit: errorMessage });
      setLoading(false);
    }
  };

  // Loading / guard states → show skeleton instead of spinners
  const isReady = !authLoading && !!user && items.length > 0;

  if (!isReady) {
    return (
      <CheckoutSkeleton ready={false}>
        <div />
      </CheckoutSkeleton>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50/50 pb-32 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-2">
            Secure Checkout
          </h1>
          <p className="text-gray-500">Complete your order</p>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Collapsible Order Summary */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setSummaryExpanded(v => !v)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Package className="w-4 h-4 text-pink-600" />
              {items.length} {items.length === 1 ? 'Item' : 'Items'} · ₹{totalPrice.toLocaleString()}
            </span>
            <span className="flex items-center gap-1 text-xs text-pink-600 font-medium">
              {summaryExpanded ? 'Hide' : 'View Details'}
              {summaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </button>
          <AnimatePresence>
            {summaryExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2">
                  <OrderSummary items={items} totalPrice={totalPrice} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Content - Single Page Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: All Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 1: Address Form */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-7 h-7 bg-pink-600 text-white rounded-full text-sm flex items-center justify-center font-bold">1</span>
                Contact & Delivery Address
              </h2>

              <div className="space-y-6">
                {/* Saved Addresses Picker */}
                {savedAddresses.length > 0 && (
                  <div className="border border-pink-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowSavedAddresses(v => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-pink-50 hover:bg-pink-100 transition-colors text-sm font-medium text-pink-700"
                    >
                      <span className="flex items-center gap-2">
                        <BookmarkCheck className="w-4 h-4" />
                        Use a different saved address ({savedAddresses.length})
                      </span>
                      {showSavedAddresses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showSavedAddresses && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="divide-y divide-gray-100">
                            {savedAddresses.map(saved => (
                              <button
                                key={saved.id}
                                type="button"
                                onClick={() => handleUseSavedAddress(saved)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors group"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-pink-700 transition-colors">
                                      {saved.fullName}
                                      {saved.isDefault && (
                                        <span className="ml-2 text-[10px] bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full font-medium">Default</span>
                                      )}
                                      {saved.addressType && (
                                        <span className="ml-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{saved.addressType}</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                      {saved.addressLine1}{saved.addressLine2 ? `, ${saved.addressLine2}` : ''}, {saved.city}, {saved.state} – {saved.pincode}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">{saved.phone}</p>
                                  </div>
                                  <span className="flex-shrink-0 text-xs text-pink-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Use →</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Contact Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Information</h3>
                  
                  <div ref={el => { fieldRefs.current['fullName'] = el; }}>
                    <Input
                      label="Full Name"
                      name="fullName"
                      value={address.fullName}
                      onChange={handleAddressChange}
                      placeholder="Enter your full name"
                      required
                      error={errors.fullName}
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div ref={el => { fieldRefs.current['email'] = el; }}>
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={address.email}
                        onChange={handleAddressChange}
                        placeholder="your@email.com"
                        required
                        error={errors.email}
                        hint="Order confirmation will be sent here"
                      />
                    </div>

                    <div ref={el => { fieldRefs.current['phone'] = el; }}>
                      <Input
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={address.phone}
                        onChange={handleAddressChange}
                        placeholder="9842253984"
                        required
                        error={errors.phone}
                        maxLength={10}
                        inputMode="tel"
                        hint="For delivery updates"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivery Address</h3>
                  
                  <div ref={el => { fieldRefs.current['street'] = el; }}>
                    <Input
                      label="Address Line 1"
                      name="street"
                      value={address.street}
                      onChange={handleAddressChange}
                      placeholder="House/Flat No., Building, Street"
                      required
                      error={errors.street}
                    />
                  </div>

                  <Input
                    label="Address Line 2"
                    name="street2"
                    value={address.street2 || ''}
                    onChange={handleAddressChange}
                    placeholder="Landmark, Area (Optional)"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div ref={el => { fieldRefs.current['state'] = el; }}>
                      <Select
                        label="State"
                        name="state"
                        value={address.state}
                        onChange={handleAddressChange}
                        options={getStateNames().map(s => ({ value: s, label: s }))}
                        placeholder="Select state"
                        required
                        error={errors.state}
                      />
                    </div>

                    <div ref={el => { fieldRefs.current['district'] = el; }}>
                      <Select
                        label="District"
                        name="district"
                        value={address.district}
                        onChange={handleAddressChange}
                        options={address.state ? getDistrictsByState(address.state).map(d => ({ value: d.name, label: d.name })) : []}
                        placeholder={address.state ? 'Select district' : 'Select state first'}
                        required
                        disabled={!address.state}
                        error={errors.district}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div ref={el => { fieldRefs.current['city'] = el; }}>
                      <Input
                        label="City / Town"
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        placeholder="Enter city name"
                        required
                        error={errors.city}
                      />
                    </div>

                    <div ref={el => { fieldRefs.current['zipCode'] = el; }}>
                      <Input
                        label="Pincode"
                        name="zipCode"
                        value={address.zipCode}
                        onChange={handleAddressChange}
                        placeholder="6-digit pincode"
                        required
                        error={errors.zipCode}
                        maxLength={6}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* SECTION 2: Payment Method */}
            <motion.div
              ref={paymentSectionRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-7 h-7 bg-pink-600 text-white rounded-full text-sm flex items-center justify-center font-bold">2</span>
                Payment Method
              </h2>

              {/* Payment Options */}
              <div className="space-y-3 mb-6">
                {/* Razorpay */}
                <label
                  className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedPaymentMethod === 'razorpay'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPaymentMethod('razorpay')}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={selectedPaymentMethod === 'razorpay'}
                    onChange={() => setSelectedPaymentMethod('razorpay')}
                    className="w-5 h-5 accent-pink-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-pink-600" />
                      <span className="font-semibold text-gray-900">Pay Online</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Credit/Debit Card • UPI • Net Banking • Wallets</p>
                  </div>
                </label>

                {/* COD */}
                <label
                  className={`flex items-center gap-4 p-5 border-2 rounded-xl transition-all ${
                    !codEligible
                      ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      : selectedPaymentMethod === 'cod'
                      ? 'border-emerald-500 bg-emerald-50 cursor-pointer'
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                  }`}
                  onClick={() => codEligible && setSelectedPaymentMethod('cod')}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={selectedPaymentMethod === 'cod'}
                    onChange={() => codEligible && setSelectedPaymentMethod('cod')}
                    disabled={!codEligible}
                    className="w-5 h-5 accent-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-gray-900">Cash on Delivery</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {codEligible
                        ? 'Pay when your order is delivered'
                        : `Available for orders up to ₹${COD_MAX_AMOUNT.toLocaleString()}`}
                    </p>
                  </div>
                </label>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-emerald-900">
                    {isCODSelected ? 'Cash on Delivery' : 'Secured by Razorpay'}
                  </p>
                  <p className="text-sm text-emerald-700">
                    {isCODSelected
                      ? 'Pay at your doorstep · No advance payment needed'
                      : '256-bit SSL • PCI DSS Compliant • RBI Approved'}
                  </p>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">🔒</span>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">100% Secure</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">🔁</span>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">5-Day Returns</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">🇮🇳</span>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium">Made in India</p>
                </div>
              </div>

              {/* Refund Policy Link */}
              <div className="mb-6 text-center">
                <Link href="/returns" className="text-xs text-pink-600 hover:text-pink-700 underline">
                  View our Refund & Return Policy
                </Link>
              </div>

              {/* Place Order Button - Desktop */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => { if (validateAddressForm()) handlePlaceOrder(); }}
                disabled={loading}
                className={`hidden lg:flex w-full py-4 text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCODSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                    : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : isCODSelected ? (
                  <>
                    <Package className="w-5 h-5" />
                    Place COD Order · ₹{totalPrice.toLocaleString()}
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay ₹{totalPrice.toLocaleString()}
                  </>
                )}
              </motion.button>
              <ReturnPolicyLine />
            </motion.div>
          </div>

          {/* Right: Sticky Order Summary (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <OrderSummary items={items} totalPrice={totalPrice} />
          </div>
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-xl font-bold text-gray-900">₹{totalPrice.toLocaleString()}</p>
          </div>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { if (validateAddressForm()) handlePlaceOrder(); }}
            disabled={loading}
            className={`flex-1 py-4 text-white rounded-full font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
              isCODSelected
                ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                : 'bg-gradient-to-r from-pink-600 to-rose-600'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing
              </>
            ) : (
              <>
                {isCODSelected ? <Package className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isCODSelected ? 'Place COD Order' : 'Pay Securely'}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
