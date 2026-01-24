'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface OrderItem {
  id: string;
  productName: string;
  product?: {
    name: string;
    images?: Array<{ url: string }>;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  totalAmount: number;
  subtotal?: number;
  gstAmount?: number;
  shippingCharge?: number;
  discount?: number;
  cancelledAt?: string;
  cancelReason?: string;
  items: OrderItem[];
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    phone?: string;
  };
  payments?: Array<{
    id: string;
    paymentMethod?: string;
    transactionId?: string;
    amount: number;
    status: string;
  }>;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const { token } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError('Failed to load order');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchOrder();
  }, [token, orderId, router, fetchOrder]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post(`/orders/${orderId}/cancel`, {
        reason: cancelReason,
      });
      if (response.data.success) {
        setOrder(response.data.data);
        setShowCancelModal(false);
        setCancelReason('');
        alert('Order cancelled successfully');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnReason.trim()) {
      alert('Please select a return reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await api.post(`/orders/${orderId}/return`, {
        reason: returnReason,
        description: returnDescription,
      });
      if (response.data.success) {
        setShowReturnModal(false);
        setReturnReason('');
        setReturnDescription('');
        alert('Return request submitted successfully');
        fetchOrder(); // Refresh order data
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to submit return request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container-luxury max-w-4xl">
          <div className="flex items-center justify-center p-20">
            <div className="inline-block w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="container-luxury max-w-4xl text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-error/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-text-primary mb-2">Order not found</h2>
          <p className="text-text-muted mb-6">The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.</p>
          <Link href="/account/orders" className="btn-primary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = ['PENDING', 'PROCESSING'].includes(order.status);
  const canReturn = order.status === 'DELIVERED';

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container-luxury max-w-4xl">
        {/* Breadcrumb */}
        <Link 
          href="/account/orders" 
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-8"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </Link>

        {error && (
          <div className="bg-error/10 border border-error/30 text-error p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Order Header */}
        <div className="bg-background-white rounded-2xl shadow-luxury p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-serif font-light text-text-primary mb-2">
                Order {order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}
              </h1>
              <p className="text-text-muted">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex gap-3">
              {canCancel && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="px-5 py-2.5 border border-error/30 text-error rounded-xl hover:bg-error/10 transition font-medium"
                >
                  Cancel Order
                </button>
              )}
              {canReturn && (
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="px-5 py-2.5 border border-accent/30 text-accent rounded-xl hover:bg-accent/10 transition font-medium"
                >
                  Request Return
                </button>
              )}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Order Status:</span>
              <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                order.status === 'DELIVERED'
                  ? 'bg-success/10 text-success'
                  : order.status === 'SHIPPED'
                    ? 'bg-primary/20 text-primary'
                    : order.status === 'PROCESSING'
                      ? 'bg-accent/20 text-accent'
                      : order.status === 'PENDING'
                        ? 'bg-yellow-500/10 text-yellow-600'
                        : order.status === 'CANCELLED'
                          ? 'bg-error/10 text-error'
                          : order.status === 'RETURNED'
                            ? 'bg-neutral-500/10 text-neutral-600'
                            : 'bg-border text-text-muted'
              }`}>
                {order.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Payment Status:</span>
              <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                order.paymentStatus === 'PAID'
                  ? 'bg-success/10 text-success'
                  : order.paymentStatus === 'PENDING'
                    ? 'bg-yellow-500/10 text-yellow-600'
                    : order.paymentStatus === 'FAILED'
                      ? 'bg-error/10 text-error'
                      : 'bg-border text-text-muted'
              }`}>
                {order.paymentStatus || 'N/A'}
              </span>
            </div>
          </div>

          {order.cancelledAt && (
            <div className="mt-4 p-4 bg-error/5 border border-error/20 rounded-xl">
              <p className="text-sm text-text-muted mb-1">Cancelled on {new Date(order.cancelledAt).toLocaleDateString()}</p>
              {order.cancelReason && (
                <p className="text-sm text-text-primary"><strong>Reason:</strong> {order.cancelReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-background-white rounded-2xl shadow-luxury p-8 mb-6">
          <h2 className="text-xl font-serif font-light text-text-primary mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 bg-background rounded-xl border border-border">
                {item.product?.images?.[0]?.url && (
                  <Image 
                    src={item.product.images[0].url} 
                    alt={item.productName || item.product?.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium text-text-primary mb-1">
                    {item.productName || item.product?.name}
                  </h3>
                  <p className="text-sm text-text-muted">Quantity: {item.quantity}</p>
                  <p className="text-sm text-text-muted">Price: ₹{Number(item.price).toFixed(2)} each</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-text-primary">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal</span>
                <span>₹{Number(order.subtotal || order.totalAmount).toFixed(2)}</span>
              </div>
              {order.gstAmount && order.gstAmount > 0 && (
                <div className="flex justify-between text-text-muted">
                  <span>GST</span>
                  <span>₹{Number(order.gstAmount).toFixed(2)}</span>
                </div>
              )}
              {order.shippingCharge && order.shippingCharge > 0 && (
                <div className="flex justify-between text-text-muted">
                  <span>Shipping</span>
                  <span>₹{Number(order.shippingCharge).toFixed(2)}</span>
                </div>
              )}
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount</span>
                  <span>-₹{Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-text-primary pt-2 border-t border-border">
                <span>Total</span>
                <span>₹{Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-background-white rounded-2xl shadow-luxury p-8 mb-6">
            <h2 className="text-xl font-serif font-light text-text-primary mb-4">Shipping Address</h2>
            <div className="p-4 bg-background rounded-xl border border-border">
              <p className="font-medium text-text-primary mb-2">{order.shippingAddress.fullName}</p>
              <p className="text-text-muted text-sm">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-text-muted text-sm">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-text-muted text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </p>
              <p className="text-text-muted text-sm">{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="text-text-muted text-sm mt-2">Phone: {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Payment Information */}
        {order.payments && order.payments.length > 0 && (
          <div className="bg-background-white rounded-2xl shadow-luxury p-8">
            <h2 className="text-xl font-serif font-light text-text-primary mb-4">Payment Information</h2>
            {order.payments.map((payment) => (
              <div key={payment.id} className="p-4 bg-background rounded-xl border border-border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-muted mb-1">Payment Method</p>
                    <p className="font-medium text-text-primary">{payment.paymentMethod || 'Razorpay'}</p>
                  </div>
                  <div>
                    <p className="text-text-muted mb-1">Transaction ID</p>
                    <p className="font-mono text-xs text-text-primary">{payment.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-text-muted mb-1">Amount</p>
                    <p className="font-semibold text-text-primary">₹{Number(payment.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-muted mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold ${
                      payment.status === 'PAID'
                        ? 'bg-success/10 text-success'
                        : payment.status === 'PENDING'
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : payment.status === 'FAILED'
                            ? 'bg-error/10 text-error'
                            : 'bg-border text-text-muted'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background-white rounded-2xl p-8 max-w-md w-full shadow-luxury">
            <h3 className="text-2xl font-serif text-text-primary mb-4">Cancel Order</h3>
            <p className="text-text-muted mb-6">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Reason for cancellation*
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                rows={4}
                placeholder="Please provide a reason..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                className="flex-1 px-5 py-3 border border-border rounded-xl hover:bg-background transition font-medium"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="flex-1 px-5 py-3 bg-error text-white rounded-xl hover:bg-error/90 transition font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background-white rounded-2xl p-8 max-w-md w-full shadow-luxury">
            <h3 className="text-2xl font-serif text-text-primary mb-4">Request Return</h3>
            <p className="text-text-muted mb-6">
              Please provide details about why you want to return this order.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Reason*
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                >
                  <option value="">Select a reason</option>
                  <option value="DEFECTIVE">Product is defective</option>
                  <option value="WRONG_ITEM">Received wrong item</option>
                  <option value="NOT_AS_DESCRIBED">Not as described</option>
                  <option value="DAMAGED">Damaged in shipping</option>
                  <option value="CHANGED_MIND">Changed my mind</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Additional details
                </label>
                <textarea
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background"
                  rows={4}
                  placeholder="Provide more details (optional)..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason('');
                  setReturnDescription('');
                }}
                disabled={actionLoading}
                className="flex-1 px-5 py-3 border border-border rounded-xl hover:bg-background transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={actionLoading}
                className="flex-1 px-5 py-3 bg-accent text-white rounded-xl hover:bg-accent/90 transition font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
