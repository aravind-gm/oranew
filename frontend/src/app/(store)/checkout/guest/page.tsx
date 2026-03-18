'use client';

/**
 * Guest Checkout Page — Phase 4
 * ===============================
 * 
 * Allows customers to purchase without creating an account.
 * Collects email, name, phone, address, and opens Razorpay.
 * 
 * Flow:
 *  1. If user is logged in → redirect to normal /checkout
 *  2. Collect guest info (email, name, phone, address)
 *  3. POST /api/orders/guest-checkout with cart items
 *  4. Open Razorpay payment modal
 *  5. On success → redirect to /checkout/success
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Lock, Truck } from 'lucide-react';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { GuestCheckoutSkeleton } from '@/components/checkout/SkeletonBlock';
import { TrustStrip, ReturnPolicyLine } from '@/components/checkout/TrustStrip';
import { CODBadge } from '@/components/checkout/CODBadge';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep', 'Puducherry',
];

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { user, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [showGuestForm, setShowGuestForm] = useState(false);

  const COD_MAX_AMOUNT = 5000;
  const cartTotal = getTotal();
  const codEligible = cartTotal <= COD_MAX_AMOUNT;
  const isCODSelected = selectedPaymentMethod === 'cod';

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // If user is logged in, redirect to normal checkout
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/checkout');
    }
  }, [authLoading, user, router]);

  // If cart is empty, redirect to products
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/products');
    }
  }, [items, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = (): boolean => {
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!form.fullName.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!form.phone || form.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!form.street.trim() || !form.city.trim() || !form.state || !form.zipCode) {
      setError('Please fill in all address fields');
      return false;
    }
    if (!/^\d{6}$/.test(form.zipCode)) {
      setError('Please enter a valid 6-digit PIN code');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      // Call guest checkout API
      const { data } = await api.post('/orders/guest-checkout', {
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: 'India',
        },
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: isCODSelected ? 'COD' : undefined,
      });

      // COD: order confirmed immediately — redirect to success
      if (data.codOrder) {
        clearCart();
        router.push(`/checkout/success?orderNumber=${data.order.orderNumber}`);
        return;
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay'));
          document.head.appendChild(script);
        });
      }

      // Open Razorpay payment modal
      const options = {
        key: data.razorpayKeyId,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: 'Ora Global — ORA Jewellery',
        description: `Order ${data.order.orderNumber}`,
        order_id: data.razorpayOrder.id,
        handler: async (response: Record<string, string>) => {
          try {
            // Verify payment
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            clearCart();
            router.push(`/checkout/success?orderNumber=${data.order.orderNumber}`);
          } catch {
            router.push(`/checkout/failed?orderId=${data.order.id}`);
          }
        },
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: '#d4af37',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window.Razorpay as any)(options);
      rzp.open();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Checkout failed. Please try again.');
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  if (authLoading || user || items.length === 0) {
    return <GuestCheckoutSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {!showGuestForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-7 text-center">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Recommended</p>
            <h2 className="text-2xl font-semibold text-gray-900">Login for Faster Checkout</h2>
            <p className="text-sm text-gray-600 mt-2 mb-6">
              Use saved addresses, faster checkout, and better order tracking.
            </p>

            <Link
              href="/auth/login?redirect=/checkout"
              className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#d4af37] text-white font-semibold hover:bg-[#c4a030] transition"
            >
              Login / Sign Up
            </Link>

            <button
              type="button"
              onClick={() => setShowGuestForm(true)}
              className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Continue as guest (optional)
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-5 gap-8 ${!showGuestForm ? 'pointer-events-none select-none blur-[1px]' : ''}`}>
          {/* Form — Left side */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#d4af37]" />
                  Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      required
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#d4af37]" />
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      value={form.street}
                      onChange={handleChange}
                      placeholder="123 Main Street, Apt 4B"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <select
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={form.zipCode}
                      onChange={handleChange}
                      placeholder="400001"
                      required
                      maxLength={6}
                      pattern="\d{6}"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#d4af37] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#d4af37]" />
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {/* Online Payment */}
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPaymentMethod === 'razorpay'
                        ? 'border-[#d4af37] bg-amber-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod('razorpay')}
                  >
                    <input
                      type="radio"
                      name="guestPayment"
                      value="razorpay"
                      checked={selectedPaymentMethod === 'razorpay'}
                      onChange={() => setSelectedPaymentMethod('razorpay')}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm">Pay Online</span>
                      <p className="text-xs text-gray-500 mt-0.5">Card · UPI · Net Banking · Wallets</p>
                    </div>
                  </label>

                  {/* COD */}
                  <label
                    className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
                      !codEligible
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : selectedPaymentMethod === 'cod'
                        ? 'border-emerald-400 bg-emerald-50/50 cursor-pointer'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }`}
                    onClick={() => codEligible && setSelectedPaymentMethod('cod')}
                  >
                    <input
                      type="radio"
                      name="guestPayment"
                      value="cod"
                      checked={selectedPaymentMethod === 'cod'}
                      onChange={() => codEligible && setSelectedPaymentMethod('cod')}
                      disabled={!codEligible}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm">Cash on Delivery</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {codEligible
                          ? 'Pay when your order arrives'
                          : `Available for orders up to ₹${COD_MAX_AMOUNT.toLocaleString()}`}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCODSelected
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#d4af37] hover:bg-[#c4a030]'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                    Processing...
                  </>
                ) : isCODSelected ? (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Place COD Order {formatPrice(cartTotal)}
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay {formatPrice(cartTotal)}
                  </>
                )}
              </button>

              {/* Trust Strip */}
              <TrustStrip />

              {/* Return policy reassurance */}
              <ReturnPolicyLine />

              {showGuestForm && (
                <p className="text-center text-xs text-gray-500">
                  Prefer account checkout?{' '}
                  <a href="/auth/login?redirect=/checkout" className="text-[#d4af37] hover:underline font-medium">
                    Login here
                  </a>
                </p>
              )}
            </form>
          </div>

          {/* Order Summary — Right side */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.image && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatPrice(getTotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>GST</span>
                  <span className="text-gray-400">Included in price</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-[#d4af37]">{formatPrice(getTotal())}</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">All prices are inclusive of GST</p>
              </div>

              <div className="mt-2 text-[10px] text-gray-400">
                <p>Sold by: <span className="text-gray-600 font-medium">Ora Global</span></p>
                <p>GSTIN: 33AAJFO8903F1ZA</p>
              </div>

              {/* COD Badge */}
              <div className="mt-3">
                <CODBadge enabled />
              </div>

              {/* Trust Strip */}
              <div className="mt-3">
                <TrustStrip />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
