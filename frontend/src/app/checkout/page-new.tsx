'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface OrderItem {
  productId: string;
  quantity: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  totalAmount: number;
  items: OrderItem[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const { items, totalPrice } = useCartStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  useEffect(() => {
    if (!token) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [token, router]);

  useEffect(() => {
    if (items.length === 0 && !order) {
      router.push('/products');
    }
  }, [items, router, order]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!address.street || !address.city || !address.state || !address.zipCode) {
        throw new Error('Please fill in all address fields');
      }

      const orderItems = items.map(item => ({
        productId: item.productId || item.id,
        quantity: item.quantity,
      }));

      const response = await api.post('/orders/checkout', {
        items: orderItems,
        shippingAddress: address,
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create order');
      }

      const createdOrder = response.data.order || response.data.data;
      setOrder(createdOrder);
      
      // CRITICAL: Redirect to payment page with orderId
      // Do NOT clear cart here - only clear on webhook confirmation
      setTimeout(() => {
        router.push(`/checkout/payment?orderId=${createdOrder.id}`);
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      setLoading(false);
    }
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Please log in to continue</p>
          <Link href="/auth/login" className="btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-background-white border-b border-border">
        <div className="container-luxury py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-text-muted hover:text-accent">Home</Link>
            <span className="text-text-muted">/</span>
            <Link href="/cart" className="text-text-muted hover:text-accent">Cart</Link>
            <span className="text-text-muted">/</span>
            <span className="text-text-primary font-medium">Checkout</span>
          </div>
        </div>
      </div>

      <div className="container-luxury py-10">
        <h1 className="text-3xl md:text-4xl font-serif font-light text-text-primary mb-2">Checkout</h1>
        <p className="text-text-muted mb-8">Complete your order and we&apos;ll ship your jewellery with care</p>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-xl">
            <p className="text-error flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCreateOrder} className="bg-background-white rounded-2xl shadow-luxury p-6 md:p-8">
              <h2 className="text-xl font-serif font-semibold text-text-primary mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Shipping Address
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Street Address</label>
                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    required
                    className="input-luxury"
                    placeholder="123 Main Street, Apartment 4B"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleAddressChange}
                      required
                      className="input-luxury"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleAddressChange}
                      required
                      className="input-luxury"
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">PIN Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={address.zipCode}
                      onChange={handleAddressChange}
                      required
                      className="input-luxury"
                      placeholder="400001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Country</label>
                    <select
                      name="country"
                      value={address.country}
                      onChange={handleAddressChange}
                      className="input-luxury"
                    >
                      <option value="India">India</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-8 py-4 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Order...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Proceed to Payment
                  </span>
                )}
              </button>
            </form>

            {/* Security Badges */}
            <div className="flex items-center justify-center gap-6 mt-6 text-text-muted text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                SSL Secure
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Razorpay Secure
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-background-white rounded-2xl shadow-luxury p-6 sticky top-32">
              <h2 className="text-xl font-serif font-semibold text-text-primary mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex-shrink-0 overflow-hidden">
                      {item.image && (
                        <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary text-sm line-clamp-1">{item.name}</p>
                      <p className="text-text-muted text-xs">Qty: {item.quantity}</p>
                      <p className="font-serif font-semibold text-accent">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="text-text-primary">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Shipping</span>
                  <span className="text-success font-medium">Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Tax</span>
                  <span className="text-text-primary">Included</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between text-lg font-serif font-bold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
