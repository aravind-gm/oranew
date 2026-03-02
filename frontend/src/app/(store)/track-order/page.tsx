'use client';

/**
 * Track Order — Full Timeline UI (Phase 10)
 * ============================================
 * Step 1: Enter order number + email → POST /api/orders/track
 * Step 2: Display vertical timeline with status icons, shipping stages,
 *          order items, estimated delivery, and courier tracking link.
 */

import api from '@/lib/api';
import { Package, Truck, CheckCircle, Clock, XCircle, ArrowLeft, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// ============================================
// TYPES
// ============================================

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  trackingNumber: string | null;
  courierName: string | null;
  shipmentStatus: string | null;
  createdAt: string;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  shippingAddress: {
    city: string;
    state: string;
    pincode: string;
  } | null;
}

// ============================================
// TIMELINE STEP CONFIG
// ============================================

interface TimelineStep {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  date?: string | null;
}

function getTimelineSteps(order: TrackedOrder): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      key: 'PLACED',
      label: 'Order Placed',
      description: `Order #${order.orderNumber} received`,
      icon: <Clock className="w-5 h-5" />,
      date: order.createdAt,
    },
    {
      key: 'CONFIRMED',
      label: 'Order Confirmed',
      description: order.paymentMethod === 'COD'
        ? 'Cash on Delivery — pay on arrival'
        : 'Payment verified & confirmed',
      icon: <CheckCircle className="w-5 h-5" />,
      date: ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status) ? order.createdAt : null,
    },
    {
      key: 'SHIPPED',
      label: 'Shipped',
      description: order.courierName
        ? `Via ${order.courierName}${order.trackingNumber ? ` • ${order.trackingNumber}` : ''}`
        : 'Your order is on the way',
      icon: <Truck className="w-5 h-5" />,
      date: order.shippedAt,
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      description: order.shippingAddress
        ? `To ${order.shippingAddress.city}, ${order.shippingAddress.state}`
        : 'Successfully delivered',
      icon: <Package className="w-5 h-5" />,
      date: order.deliveredAt,
    },
  ];

  // If cancelled, replace remaining steps
  if (order.status === 'CANCELLED') {
    const cancelIndex = steps.findIndex((s) => !s.date);
    if (cancelIndex >= 0) {
      steps.splice(cancelIndex, steps.length - cancelIndex, {
        key: 'CANCELLED',
        label: 'Cancelled',
        description: 'This order has been cancelled',
        icon: <XCircle className="w-5 h-5" />,
        date: order.cancelledAt,
      });
    }
  }

  return steps;
}

function getStepStatus(step: TimelineStep, allSteps: TimelineStep[], order: TrackedOrder) {
  if (order.status === 'CANCELLED' && step.key === 'CANCELLED') return 'cancelled';
  if (step.date) return 'completed';
  // Check if this is the current active step
  const completedCount = allSteps.filter((s) => s.date).length;
  const thisIndex = allSteps.indexOf(step);
  if (thisIndex === completedCount) return 'active';
  return 'pending';
}

// ============================================
// ESTIMATED DELIVERY
// ============================================

function getEstimatedDelivery(order: TrackedOrder): string {
  if (order.status === 'DELIVERED') return 'Delivered';
  if (order.status === 'CANCELLED') return 'Cancelled';

  const createdDate = new Date(order.createdAt);
  const minDays = order.status === 'SHIPPED' ? 1 : 3;
  const maxDays = order.status === 'SHIPPED' ? 3 : 7;

  const minDate = new Date(createdDate.getTime() + minDays * 24 * 60 * 60 * 1000);
  const maxDate = new Date(createdDate.getTime() + maxDays * 24 * 60 * 60 * 1000);

  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(minDate)} – ${fmt(maxDate)}`;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!orderNumber || !email) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/orders/track', {
        orderNumber: orderNumber.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      });
      const data = res.data?.data;
      if (data) {
        data.totalAmount = Number(data.totalAmount) || 0;
        data.items?.forEach((item: any) => {
          item.unitPrice = Number(item.unitPrice) || 0;
          item.totalPrice = Number(item.totalPrice) || 0;
        });
        setOrder(data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order not found. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrder(null);
    setOrderNumber('');
    setEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-pink-50/30 py-12 sm:py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {!order ? (
          /* =================== SEARCH FORM =================== */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-pink-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif text-gray-900 mb-2">
                Track Your Order
              </h1>
              <p className="text-gray-500 text-sm">
                Enter your order details to see real-time status
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ORD-XXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Found in your order confirmation email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full font-semibold hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 transition-all text-sm"
              >
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </form>

            {/* Already have account */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-sm mb-2">Already have an account?</p>
              <Link href="/account/orders" className="text-pink-600 hover:text-pink-700 font-medium text-sm">
                View all orders →
              </Link>
            </div>
          </div>
        ) : (
          /* =================== ORDER TIMELINE =================== */
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-pink-500 font-semibold mb-1">
                    Order Tracking
                  </p>
                  <h1 className="text-xl font-serif text-gray-900">
                    #{order.orderNumber}
                  </h1>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:text-pink-600 transition-colors"
                >
                  Track another
                </button>
              </div>

              {/* Status badge + estimated delivery */}
              <div className="flex flex-wrap gap-3 items-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : order.status === 'CANCELLED'
                        ? 'bg-red-50 text-red-700'
                        : order.status === 'SHIPPED'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {order.status === 'DELIVERED' && <CheckCircle className="w-3.5 h-3.5" />}
                  {order.status === 'CANCELLED' && <XCircle className="w-3.5 h-3.5" />}
                  {order.status === 'SHIPPED' && <Truck className="w-3.5 h-3.5" />}
                  {!['DELIVERED', 'CANCELLED', 'SHIPPED'].includes(order.status) && <Clock className="w-3.5 h-3.5" />}
                  {order.status}
                </span>

                {order.status !== 'CANCELLED' && (
                  <span className="text-xs text-gray-500">
                    Est. delivery: <strong>{getEstimatedDelivery(order)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-6">
                Order Progress
              </h2>

              <div className="space-y-0">
                {(() => {
                  const steps = getTimelineSteps(order);
                  return steps.map((step, idx) => {
                    const status = getStepStatus(step, steps, order);
                    const isLast = idx === steps.length - 1;
                    return (
                      <div key={step.key} className="flex gap-4">
                        {/* Icon column */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              status === 'completed'
                                ? 'bg-pink-600 text-white'
                                : status === 'active'
                                  ? 'bg-pink-100 text-pink-600 ring-4 ring-pink-50'
                                  : status === 'cancelled'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {step.icon}
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-12 my-1 ${
                                status === 'completed' ? 'bg-pink-300' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-8">
                          <p
                            className={`font-medium text-sm ${
                              status === 'completed' || status === 'active'
                                ? 'text-gray-900'
                                : status === 'cancelled'
                                  ? 'text-red-700'
                                  : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                          {step.date && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(step.date).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Courier tracking link */}
              {order.trackingNumber && order.courierName && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Tracking: {order.trackingNumber}
                    </p>
                    <p className="text-xs text-blue-700">via {order.courierName}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Order Items
              </h2>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 ml-4">
                      ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Help */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact our customer support team for assistance.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:admin@orashop.in" className="text-pink-600 hover:underline">
                    admin@orashop.in
                  </a>
                </p>
                <p>
                  <strong>Phone:</strong> 9842253984, 9095007887, 9342865987
                </p>
                <p>
                  <strong>Hours:</strong> Mon-Sat, 10:00 AM - 6:00 PM IST
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
