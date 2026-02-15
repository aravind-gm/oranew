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
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Lock, Shield, Truck, CreditCard, AlertCircle, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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

type CheckoutStep = 'address' | 'review' | 'payment';

// ============================================================================
// STEP INDICATOR COMPONENT
// ============================================================================

function StepIndicator({ currentStep }: { currentStep: CheckoutStep }) {
  const steps = [
    { id: 'address', label: 'Address', number: 1 },
    { id: 'review', label: 'Review', number: 2 },
    { id: 'payment', label: 'Payment', number: 3 },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-0 mb-8 lg:mb-12">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                idx < currentIndex
                  ? 'bg-emerald-500 text-white'
                  : idx === currentIndex
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {idx < currentIndex ? <Check className="w-5 h-5" /> : step.number}
            </div>
            <span
              className={`mt-2 text-xs font-medium ${
                idx <= currentIndex ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          
          {/* Connector Line */}
          {idx < steps.length - 1 && (
            <div
              className={`w-16 sm:w-24 h-0.5 mx-2 transition-colors ${
                idx < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
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

const SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;

function OrderSummary({ items, totalPrice }: { items: Array<{ productId: string; name: string; image: string; price: number; quantity: number }>; totalPrice: number }) {
  const shippingCost = totalPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const displayTotal = totalPrice + shippingCost;
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
          {shippingCost === 0 ? (
            <span className="text-emerald-600 font-medium">FREE</span>
          ) : (
            <span className="font-medium text-gray-900">₹{shippingCost}</span>
          )}
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

      {/* Trust Badges */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-center gap-6 text-center">
          <div>
            <div className="w-8 h-8 mx-auto mb-1 bg-emerald-50 rounded-full flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] text-gray-500">Free Shipping</p>
          </div>
          <div>
            <div className="w-8 h-8 mx-auto mb-1 bg-blue-50 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[10px] text-gray-500">Secure</p>
          </div>
          <div>
            <div className="w-8 h-8 mx-auto mb-1 bg-amber-50 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[10px] text-gray-500">Easy Returns</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN CHECKOUT PAGE COMPONENT
// ============================================================================

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, totalPrice } = useCartStore();

  // State
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth/login?redirect=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  // Empty cart redirect
  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items.length, router]);

  // Handlers
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

  const validateAddressForm = (): boolean => {
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
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToReview = () => {
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

      setCurrentStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContinueToPayment = () => {
    setCurrentStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create order');
      }

      const createdOrder = response.data.order || response.data.data;

      // Analytics: add_payment_info
      trackAddPaymentInfo({
        orderId: createdOrder.id,
        total: totalPrice,
        paymentMethod: 'razorpay',
        items: items.map((item) => ({
          id: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      router.push(`/checkout/payment?orderId=${createdOrder.id}`);
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

  // Loading state
  if (authLoading || !isAuthenticated || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Loading checkout...</p>
        </div>
      </div>
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

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Form Sections */}
          <div className="lg:col-span-2">
            
            {/* STEP 1: Address Form */}
            {currentStep === 'address' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact & Delivery Address</h2>

                <div className="space-y-6">
                  {/* Contact Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Information</h3>
                    
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  {/* Address Section */}
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Delivery Address</h3>
                    
                    <Input
                      label="Address Line 1"
                      name="street"
                      value={address.street}
                      onChange={handleAddressChange}
                      placeholder="House/Flat No., Building, Street"
                      required
                      error={errors.street}
                    />

                    <Input
                      label="Address Line 2"
                      name="street2"
                      value={address.street2 || ''}
                      onChange={handleAddressChange}
                      placeholder="Landmark, Area (Optional)"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="City / Town"
                        name="city"
                        value={address.city}
                        onChange={handleAddressChange}
                        placeholder="Enter city name"
                        required
                        error={errors.city}
                      />

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

                  {/* Continue Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleContinueToReview}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold text-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Continue to Review
                    <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Review */}
            {currentStep === 'review' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Address Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Delivery Details</h2>
                    <button
                      onClick={() => setCurrentStep('address')}
                      className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                      <p className="font-medium text-gray-900">{address.fullName}</p>
                      <p className="text-sm text-gray-600">{address.email}</p>
                      <p className="text-sm text-gray-600">{address.phone}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Shipping Address</p>
                      <p className="text-sm text-gray-900">{address.street}</p>
                      {address.street2 && <p className="text-sm text-gray-600">{address.street2}</p>}
                      <p className="text-sm text-gray-600">{address.city}, {address.district}</p>
                      <p className="text-sm text-gray-600">{address.state} - {address.zipCode}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Items</h2>
                  
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-pink-50">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleContinueToPayment}
                  className="w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold text-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                </motion.button>
              </motion.div>
            )}

            {/* STEP 3: Payment */}
            {currentStep === 'payment' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Method</h2>

                {/* Payment Option */}
                <div className="space-y-4 mb-8">
                  <label className="flex items-center gap-4 p-5 border-2 border-pink-500 bg-pink-50 rounded-xl cursor-pointer">
                    <input type="radio" name="payment" value="razorpay" defaultChecked className="w-5 h-5 accent-pink-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-pink-600" />
                        <span className="font-semibold text-gray-900">Razorpay Secure Payments</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Credit/Debit Card • UPI • Net Banking • Wallets</p>
                    </div>
                  </label>
                </div>

                {/* Razorpay Security Badge */}
                <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900">Secured by Razorpay</p>
                    <p className="text-sm text-emerald-700">256-bit SSL • PCI DSS Compliant • RBI Approved</p>
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
                <div className="mb-8 text-center">
                  <Link href="/returns" className="text-xs text-pink-600 hover:text-pink-700 underline">
                    View our Refund & Return Policy
                  </Link>
                </div>

                {/* Place Order Button - Desktop */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="hidden lg:flex w-full py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold text-lg hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Pay ₹{totalPrice.toLocaleString()}
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Right: Order Summary */}
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
            onClick={
              currentStep === 'address' 
                ? handleContinueToReview 
                : currentStep === 'review' 
                  ? handleContinueToPayment 
                  : handlePlaceOrder
            }
            disabled={loading && currentStep === 'payment'}
            className="flex-1 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && currentStep === 'payment' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing
              </>
            ) : currentStep === 'payment' ? (
              <>
                <Lock className="w-4 h-4" />
                Pay Now
              </>
            ) : (
              'Continue'
            )}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
