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
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    name: string;
    sku: string;
    images?: Array<{ imageUrl: string }>;
  };
}

interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface Payment {
  id: string;
  status: string;
  amount: number;
  paymentGateway: string;
  transactionId?: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  subtotal: number;
  gstAmount: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  trackingNumber?: string;
  courierName?: string;
  shiprocketOrderId?: string;
  shipmentStatus?: string;
  notes?: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  payments: Payment[];
  user: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token, user, isHydrated } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');
  const [shiprocketOrderId, setShiprocketOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      const response = await api.get(`/admin/orders/${params.id}`);
      if (response.data.success) {
        setOrder(response.data.data);
        setStatus(response.data.data.status);
        setTrackingNumber(response.data.data.trackingNumber || '');
        setCourierName(response.data.data.courierName || '');
        setShiprocketOrderId(response.data.data.shiprocketOrderId || '');
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }

    fetchOrder();
  }, [isHydrated, token, user, router, fetchOrder]);

  const handleUpdateStatus = async () => {
    if (!order || status === order.status) return;

    if (!token || !isHydrated) {
      setError('Authentication not ready. Please refresh and try again.');
      return;
    }

    setUpdating(true);
    setError('');
    
    try {
      const payload: { 
        status: string; 
        trackingNumber?: string; 
        courierName?: string;
        shiprocketOrderId?: string;
        cancelReason?: string 
      } = { status };
      
      if (trackingNumber) payload.trackingNumber = trackingNumber;
      if (courierName) payload.courierName = courierName;
      if (shiprocketOrderId) payload.shiprocketOrderId = shiprocketOrderId;
      if (status === 'CANCELLED' && cancelReason) payload.cancelReason = cancelReason;

      const response = await api.put(`/admin/orders/${params.id}/status`, payload);
      
      if (response.data.success) {
        setOrder({ 
          ...order, 
          status, 
          trackingNumber,
          courierName,
          shiprocketOrderId
        });
        alert('Order status updated successfully');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (orderStatus: string) => {
    switch (orderStatus) {
      case 'PENDING':
        return 'bg-yellow-900 text-yellow-200';
      case 'CONFIRMED':
        return 'bg-blue-900 text-blue-200';
      case 'PROCESSING':
        return 'bg-indigo-900 text-indigo-200';
      case 'SHIPPED':
        return 'bg-purple-900 text-purple-200';
      case 'DELIVERED':
        return 'bg-green-900 text-green-200';
      case 'CANCELLED':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/orders" className="text-blue-400 hover:underline mb-6 inline-block">
            ← Back to Orders
          </Link>
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin/orders" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Back to Orders
        </Link>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          {/* Order Header */}
          <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-700">
            <div>
              <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
              <p className="text-gray-400 mt-1">
                Placed on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
              <span className={`text-sm ${order.paymentStatus === 'CONFIRMED' ? 'text-green-400' : 'text-yellow-400'}`}>
                Payment: {order.paymentStatus}
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Status Update */}
          <div className="bg-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">📦 Manual Order Management</h2>
            <p className="text-gray-400 text-sm mb-4">
              Update order status and shipping information manually. System will NOT auto-update via webhooks.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Order Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Courier Name</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g., Delhivery, BlueDart"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Shiprocket Order ID</label>
                <input
                  type="text"
                  value={shiprocketOrderId}
                  onChange={(e) => setShiprocketOrderId(e.target.value)}
                  placeholder="Future integration"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white"
                  disabled
                />
              </div>
            </div>
            
            {status === 'CANCELLED' && (
              <div className="mt-4">
                <label className="block text-sm text-gray-400 mb-1">Cancellation Reason *</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation"
                  className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white"
                />
              </div>
            )}
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleUpdateStatus}
                disabled={updating || status === order.status}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded font-semibold transition"
              >
                {updating ? 'Updating...' : '✓ Update Order'}
              </button>
              
              {(status === 'SHIPPED' || status === 'DELIVERED') && !trackingNumber && (
                <div className="flex-1 bg-yellow-900/20 border border-yellow-700 rounded px-4 py-2 text-yellow-400 text-sm flex items-center">
                  ⚠️ Add tracking number for better customer experience
                </div>
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Customer</h2>
              <p className="font-medium">{order.user.fullName}</p>
              <p className="text-gray-400">{order.user.email}</p>
              {order.user.phone && <p className="text-gray-400">{order.user.phone}</p>}
            </div>
            
            <div className="bg-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Shipping Address</h2>
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-gray-400">{order.shippingAddress.phone}</p>
              <p className="text-gray-400">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-gray-400">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-gray-400">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="bg-gray-700 p-4 rounded-lg flex items-center gap-4">
                  {item.product?.images?.[0]?.imageUrl && (
                    <Image
                      src={item.product.images[0].imageUrl}
                      alt={item.productName}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{item.productName}</p>
                    {item.product?.sku && (
                      <p className="text-sm text-gray-400">SKU: {item.product.sku}</p>
                    )}
                    <p className="text-gray-400">
                      {formatCurrency(Number(item.unitPrice))} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-lg">{formatCurrency(Number(item.totalPrice))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          {order.payments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Payment History</h2>
              <div className="space-y-2">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">{payment.paymentGateway}</p>
                      {payment.transactionId && (
                        <p className="text-sm text-gray-400">ID: {payment.transactionId}</p>
                      )}
                      <p className="text-sm text-gray-400">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(Number(payment.amount))}</p>
                      <p className={`text-sm ${payment.status === 'CONFIRMED' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal:</span>
                <span>{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">GST:</span>
                <span>{formatCurrency(Number(order.gstAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping:</span>
                <span>{formatCurrency(Number(order.shippingFee))}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount:</span>
                  <span>-{formatCurrency(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold border-t border-gray-600 pt-4 mt-4">
                <span>Total:</span>
                <span>{formatCurrency(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
