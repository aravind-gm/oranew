'use client';

/**
 * ORA Admin Panel - Order Details Page
 * =====================================
 * 
 * Complete order view with:
 * - Live backend API data
 * - Customer info
 * - Product details & View Product links
 * - Payment & shipping status (COD support)
 * - Status updates
 * - Email triggers
 * - Invoice download & packing slip
 * - Refund management
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import AdminLayout from '../../components/AdminLayout';
import { 
  PageHeader, 
  Button, 
  Badge, 
  Card, 
  CardTitle, 
  Select,
  Textarea,
  Alert,
  Spinner,
} from '../../components/ui';
import {
  ArrowLeft,
  Download,
  Mail,
  Printer,
  Truck,
  Package,
  CreditCard,
  User,
  MapPin,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  RotateCcw,
  IndianRupee,
  Eye,
  Trash2,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    sku?: string;
    slug?: string;
    images?: Array<{ imageUrl: string; isPrimary?: boolean }>;
  };
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  customer: {
    id?: string;
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  billingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  gstAmount: number;
  shippingFee: number;
  totalAmount: number;
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// ============================================
// STATUS BADGES
// ============================================

const OrderStatusBadge = ({ status }: { status: OrderDetails['status'] }) => {
  const config: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'primary'; label: string }> = {
    PENDING: { variant: 'warning', label: 'Pending' },
    CONFIRMED: { variant: 'info', label: 'Confirmed' },
    PROCESSING: { variant: 'info', label: 'Processing' },
    SHIPPED: { variant: 'primary', label: 'Shipped' },
    DELIVERED: { variant: 'success', label: 'Delivered' },
    CANCELLED: { variant: 'error', label: 'Cancelled' },
    RETURNED: { variant: 'secondary', label: 'Returned' },
    REFUNDED: { variant: 'secondary', label: 'Refunded' },
  };

  const { variant, label } = config[status] || { variant: 'secondary', label: status };
  return <Badge variant={variant} size="md">{label}</Badge>;
};

const PaymentBadge = ({ status, method }: { status: OrderDetails['paymentStatus']; method?: string }) => {
  const isCOD = method?.toUpperCase() === 'COD';

  if (isCOD) {
    if (status === 'CONFIRMED') {
      return <Badge variant="success">Paid (COD)</Badge>;
    }
    return <Badge variant="warning">COD (Pending)</Badge>;
  }

  if (status === 'CONFIRMED') {
    return <Badge variant="success">Paid</Badge>;
  } else if (status === 'FAILED') {
    return <Badge variant="error">Failed</Badge>;
  } else if (status === 'REFUNDED') {
    return <Badge variant="secondary">Refunded</Badge>;
  }

  return <Badge variant="warning">Pending</Badge>;
};

// ============================================
// TIMELINE COMPONENT
// ============================================

interface TimelineEvent {
  id: string;
  status: string;
  title: string;
  description?: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

const OrderTimeline = ({ events }: { events: TimelineEvent[] }) => {
  return (
    <div className="relative">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
          <div className="relative flex flex-col items-center">
            <div className={`
              w-4 h-4 rounded-full border-2 z-10
              ${event.completed 
                ? 'bg-[#22c55e] border-[#22c55e]' 
                : event.current
                ? 'bg-[#d4af37] border-[#d4af37] animate-pulse'
                : 'bg-white border-[#d1d5db]'
              }
            `}>
              {event.completed && (
                <CheckCircle size={12} className="text-white absolute inset-0 m-auto" />
              )}
            </div>
            {index < events.length - 1 && (
              <div className={`
                absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-full
                ${event.completed ? 'bg-[#22c55e]' : 'bg-[#e5e7eb]'}
              `} />
            )}
          </div>

          <div className="flex-1 pt-0.5">
            <p className={`font-medium text-sm ${event.completed || event.current ? 'text-[#111827]' : 'text-[#9ca3af]'}`}>
              {event.title}
            </p>
            {event.description && (
              <p className="text-sm text-[#9ca3af] mt-0.5">{event.description}</p>
            )}
            {event.timestamp && (
              <p className="text-xs text-[#9ca3af] mt-1">
                {new Date(event.timestamp).toLocaleDateString('en-IN', {
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
      ))}
    </div>
  );
};

// ============================================
// ORDER DETAILS PAGE
// ============================================

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');
  const [courierInput, setCourierInput] = useState('bluedart');

  // Handle order deletion
  const handleDeleteOrder = async () => {
    setUpdating(true);
    try {
      const response = await api.delete(`/admin/orders/${orderId}`);
      if (response.data.success) {
        router.push('/admin/v2/orders');
      }
    } catch (err: any) {
      console.error('Error deleting order:', err);
      alert(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setUpdating(false);
    }
  };

  // Fetch order details from API
  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/admin/orders/${orderId}`);
        const raw = response.data?.data || response.data;
        if (!raw) throw new Error('Order data not found');

        const formattedOrder: OrderDetails = {
          id: raw.id,
          orderNumber: raw.orderNumber || raw.id,
          status: raw.status || 'PENDING',
          paymentStatus: raw.paymentStatus || 'PENDING',
          paymentMethod: raw.paymentMethod || 'Razorpay',
          customer: {
            id: raw.user?.id || raw.userId || '',
            name: raw.user?.fullName || raw.shippingAddress?.fullName || 'Guest Customer',
            email: raw.user?.email || raw.shippingAddress?.email || 'N/A',
            phone: raw.user?.phone || raw.shippingAddress?.phone || 'N/A',
          },
          shippingAddress: {
            fullName: raw.shippingAddress?.fullName || 'N/A',
            phone: raw.shippingAddress?.phone || 'N/A',
            addressLine1: raw.shippingAddress?.addressLine1 || '',
            addressLine2: raw.shippingAddress?.addressLine2 || '',
            city: raw.shippingAddress?.city || '',
            state: raw.shippingAddress?.state || '',
            pincode: raw.shippingAddress?.pincode || '',
            country: raw.shippingAddress?.country || 'India',
          },
          billingAddress: {
            fullName: raw.billingAddress?.fullName || raw.shippingAddress?.fullName || 'N/A',
            phone: raw.billingAddress?.phone || raw.shippingAddress?.phone || 'N/A',
            addressLine1: raw.billingAddress?.addressLine1 || raw.shippingAddress?.addressLine1 || '',
            addressLine2: raw.billingAddress?.addressLine2 || raw.shippingAddress?.addressLine2 || '',
            city: raw.billingAddress?.city || raw.shippingAddress?.city || '',
            state: raw.billingAddress?.state || raw.shippingAddress?.state || '',
            pincode: raw.billingAddress?.pincode || raw.shippingAddress?.pincode || '',
            country: raw.billingAddress?.country || 'India',
          },
          items: (raw.items || []).map((item: any) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName || item.product?.name || 'Product',
            productImage: item.productImage || item.product?.images?.[0]?.imageUrl || null,
            quantity: item.quantity || 1,
            unitPrice: Number(item.unitPrice || 0),
            totalPrice: Number(item.totalPrice || (item.unitPrice * item.quantity)),
            product: item.product,
          })),
          subtotal: Number(raw.subtotal || 0),
          discountAmount: Number(raw.discountAmount || 0),
          couponCode: raw.couponCode,
          gstAmount: Number(raw.gstAmount || 0),
          shippingFee: Number(raw.shippingFee || 0),
          totalAmount: Number(raw.totalAmount || 0),
          trackingNumber: raw.trackingNumber,
          courierName: raw.courierName,
          notes: raw.notes,
          createdAt: raw.createdAt,
          shippedAt: raw.shippedAt,
          deliveredAt: raw.deliveredAt,
          cancelledAt: raw.cancelledAt,
          cancelReason: raw.cancelReason,
        };

        setOrder(formattedOrder);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle status update via API
  const handleStatusUpdate = async (newStatus: OrderDetails['status'], trackingNum?: string, courier?: string) => {
    setUpdating(true);
    try {
      const response = await api.put(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        ...(trackingNum && { trackingNumber: trackingNum }),
        ...(courier && { courierName: courier }),
        ...(newStatus === 'CANCELLED' && cancelReason && { cancelReason }),
      });

      if (response.data.success || response.data.data) {
        const updated = response.data.data || response.data;
        setOrder((prev) => prev ? {
          ...prev,
          status: newStatus,
          paymentStatus: (newStatus === 'DELIVERED' && prev.paymentMethod === 'COD') ? 'CONFIRMED' : prev.paymentStatus,
          ...(trackingNum && { trackingNumber: trackingNum }),
          ...(courier && { courierName: courier }),
        } : null);
        setShowCancelModal(false);
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Generate timeline events
  const getTimelineEvents = (): TimelineEvent[] => {
    if (!order) return [];

    const isCOD = order.paymentMethod === 'COD';

    return [
      {
        id: 'placed',
        status: 'PLACED',
        title: 'Order Placed',
        description: isCOD ? 'Order placed with Cash on Delivery' : 'Order placed by customer',
        timestamp: order.createdAt,
        completed: true,
      },
      {
        id: 'confirmed',
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        description: isCOD ? 'COD order accepted' : 'Payment verified and order confirmed',
        timestamp: order.createdAt,
        completed: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        current: order.status === 'CONFIRMED',
      },
      {
        id: 'processing',
        status: 'PROCESSING',
        title: 'Processing',
        description: 'Order is being packed and prepared',
        timestamp: '',
        completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        current: order.status === 'PROCESSING',
      },
      {
        id: 'shipped',
        status: 'SHIPPED',
        title: 'Shipped',
        description: order.trackingNumber ? `Courier: ${order.courierName || 'Shipment'} (${order.trackingNumber})` : 'Package has been shipped',
        timestamp: order.shippedAt || '',
        completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
        current: order.status === 'SHIPPED',
      },
      {
        id: 'delivered',
        status: 'DELIVERED',
        title: 'Delivered',
        description: isCOD ? 'Package delivered & Cash collected' : 'Package delivered successfully',
        timestamp: order.deliveredAt || '',
        completed: order.status === 'DELIVERED',
        current: order.status === 'DELIVERED',
      },
    ];
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--admin-text-muted)]">Loading order details...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-[var(--admin-error-500)] mb-4" />
          <h2 className="text-xl font-semibold text-[var(--admin-text-primary)] mb-2">Order Not Found</h2>
          <p className="text-[var(--admin-text-muted)] mb-4">{error || "The order you're looking for doesn't exist."}</p>
          <Button onClick={() => router.push('/admin/v2/orders')}>
            Back to Orders
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/admin/v2/orders')}
              leftIcon={<ArrowLeft size={16} />}
            >
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[var(--admin-text-primary)] font-serif">
                  Order #{order.orderNumber}
                </h1>
                <OrderStatusBadge status={order.status} />
                <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
              </div>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">
                Placed on {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/v2/orders/${order.id}/packing-slip`} target="_blank">
              <Button variant="secondary" size="sm" leftIcon={<Printer size={16} />}>
                Packing Slip
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              size="sm" 
              leftIcon={<Download size={16} />}
              onClick={() => window.print()}
            >
              Invoice
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={16} />}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Order
            </Button>
          </div>
        </div>

        {/* Status Action Bar */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">Order Status</p>
                <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
              </div>
              <div className="h-8 w-px bg-[var(--admin-border-light)]" />
              <div>
                <p className="text-xs text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">Payment Method</p>
                <p className="font-semibold text-sm text-[var(--admin-text-primary)] mt-1">
                  {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online (Razorpay)'}
                </p>
              </div>
              <div className="h-8 w-px bg-[var(--admin-border-light)]" />
              <div>
                <p className="text-xs text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">Payment Status</p>
                <div className="mt-1">
                  <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
                </div>
              </div>
            </div>

            {/* Quick Status Update Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {order.status === 'PENDING' && (
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={updating}
                  onClick={() => handleStatusUpdate('CONFIRMED')}
                >
                  Confirm Order
                </Button>
              )}
              {order.status === 'CONFIRMED' && (
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={updating}
                  onClick={() => handleStatusUpdate('PROCESSING')}
                >
                  Start Processing
                </Button>
              )}
              {order.status === 'PROCESSING' && (
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={updating}
                  onClick={() => handleStatusUpdate('SHIPPED')}
                >
                  Mark as Shipped
                </Button>
              )}
              {order.status === 'SHIPPED' && (
                <Button
                  size="sm"
                  variant="success"
                  isLoading={updating}
                  onClick={() => handleStatusUpdate('DELIVERED')}
                >
                  Mark as Delivered
                </Button>
              )}
              {!['CANCELLED', 'DELIVERED', 'REFUNDED'].includes(order.status) && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setShowCancelModal(true)}
                  leftIcon={<XCircle size={16} />}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Order Items ({order.items.length})</CardTitle>
                <span className="text-xs text-[var(--admin-text-muted)] font-medium">Click items or View Product to see details</span>
              </div>
              <div className="space-y-4">
                {order.items.map((item) => {
                  const imgUrl = item.productImage || item.product?.images?.[0]?.imageUrl;
                  return (
                    <div 
                      key={item.id} 
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--admin-border-light)] last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-16 h-16 bg-[var(--admin-bg-secondary)] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--admin-border-light)] shadow-sm">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={24} className="text-[var(--admin-text-muted)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link 
                            href={`/admin/v2/products/${item.productId}`}
                            className="font-semibold text-[var(--admin-text-primary)] hover:text-[var(--admin-primary-600)] hover:underline block truncate text-base"
                          >
                            {item.productName}
                          </Link>
                          {item.product?.sku && (
                            <p className="text-xs text-[var(--admin-text-muted)] font-mono">SKU: {item.product.sku}</p>
                          )}
                          <p className="text-sm text-[var(--admin-text-muted)] mt-0.5">
                            Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <p className="font-bold text-[var(--admin-text-primary)] text-base">
                            {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                        
                        {/* View Product Action */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/v2/products/${item.productId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--admin-primary-700)] bg-[var(--admin-primary-50)] hover:bg-[var(--admin-primary-100)] rounded-lg border border-[var(--admin-primary-200)] transition-colors shadow-xs"
                            title="View product details in Admin Panel"
                          >
                            <Eye size={14} />
                            View Product
                          </Link>
                          {item.product?.slug && (
                            <a
                              href={`/product/${item.product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center p-1.5 text-xs text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              title="View product on Storefront"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary Breakdown */}
              <div className="mt-6 pt-4 border-t border-[var(--admin-border-light)] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--admin-text-muted)]">Subtotal</span>
                  <span className="text-[var(--admin-text-primary)]">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">
                      Discount {order.couponCode && <Badge variant="gold" size="sm">{order.couponCode}</Badge>}
                    </span>
                    <span className="text-[var(--admin-success-600)]">-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--admin-text-muted)]">GST (Included/Tax)</span>
                  <span className="text-[var(--admin-text-primary)]">{formatCurrency(order.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--admin-text-muted)]">Shipping</span>
                  <span className="text-[var(--admin-text-primary)]">
                    {order.shippingFee === 0 ? 'Free Shipping' : formatCurrency(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[var(--admin-border-light)]">
                  <span className="font-bold text-base text-[var(--admin-text-primary)]">Total Amount</span>
                  <span className="font-extrabold text-xl text-[var(--admin-primary-700)]">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </Card>

            {/* Shipping & Billing Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Truck size={18} className="text-[var(--admin-text-muted)]" />
                  <CardTitle>Shipping Address</CardTitle>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-[var(--admin-text-primary)]">{order.shippingAddress.fullName}</p>
                  <p className="text-[var(--admin-text-secondary)]">{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="text-[var(--admin-text-secondary)]">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-[var(--admin-text-secondary)]">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                  </p>
                  <p className="text-[var(--admin-text-secondary)]">{order.shippingAddress.country}</p>
                  <p className="text-[var(--admin-text-muted)] pt-2 flex items-center gap-1.5">
                    <Phone size={14} /> {order.shippingAddress.phone}
                  </p>
                </div>
              </Card>

              {/* Payment Details */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={18} className="text-[var(--admin-text-muted)]" />
                  <CardTitle>Payment Details</CardTitle>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Payment Gateway</span>
                    <span className="font-medium text-[var(--admin-text-primary)]">
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Status</span>
                    <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Total Charged</span>
                    <span className="font-bold text-[var(--admin-text-primary)]">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-[var(--admin-text-muted)]" />
                <CardTitle>Customer Details</CardTitle>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--admin-primary-100)] flex items-center justify-center">
                    <span className="font-bold text-[var(--admin-primary-700)]">
                      {order.customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--admin-text-primary)] truncate">{order.customer.name}</p>
                    {order.customer.id && (
                      <Link 
                        href={`/admin/v2/customers/${order.customer.id}`}
                        className="text-xs text-[var(--admin-primary-600)] hover:underline"
                      >
                        View Customer Profile
                      </Link>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--admin-border-light)] space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-[var(--admin-text-secondary)]">
                    <Mail size={14} className="text-[var(--admin-text-muted)]" />
                    <span className="truncate">{order.customer.email}</span>
                  </p>
                  <p className="flex items-center gap-2 text-[var(--admin-text-secondary)]">
                    <Phone size={14} className="text-[var(--admin-text-muted)]" />
                    <span>{order.customer.phone}</span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <CardTitle className="mb-4">Order Timeline</CardTitle>
              <OrderTimeline events={getTimelineEvents()} />
            </Card>

            {/* Tracking Info (if available) */}
            {order.trackingNumber ? (
              <Card>
                <CardTitle className="mb-4">Courier & Tracking</CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Courier Name</span>
                    <span className="font-semibold text-[var(--admin-text-primary)]">{order.courierName || 'Shipment'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Tracking Number</span>
                    <span className="font-mono text-sm font-bold text-[var(--admin-text-primary)]">{order.trackingNumber}</span>
                  </div>
                </div>
              </Card>
            ) : (
              /* Add Tracking Widget if processing or confirmed */
              ['CONFIRMED', 'PROCESSING'].includes(order.status) && (
                <Card>
                  <CardTitle className="mb-4">Add Tracking Details</CardTitle>
                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1 text-xs font-semibold text-[var(--admin-text-secondary)]">Courier Partner</label>
                      <select
                        value={courierInput}
                        onChange={(e) => setCourierInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--admin-border-default)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-200)]"
                      >
                        <option value="BlueDart">BlueDart</option>
                        <option value="Delhivery">Delhivery</option>
                        <option value="DTDC">DTDC</option>
                        <option value="Ecom Express">Ecom Express</option>
                        <option value="Shiprocket">Shiprocket</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-semibold text-[var(--admin-text-secondary)]">AWB / Tracking Number</label>
                      <input
                        type="text"
                        value={trackingNumberInput}
                        onChange={(e) => setTrackingNumberInput(e.target.value)}
                        placeholder="e.g. BD123456789IN"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--admin-border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-200)]"
                      />
                    </div>

                    <Button
                      className="w-full mt-2"
                      isLoading={updating}
                      disabled={!trackingNumberInput.trim()}
                      leftIcon={<Truck size={16} />}
                      onClick={() => handleStatusUpdate('SHIPPED', trackingNumberInput, courierInput)}
                    >
                      Save & Mark as Shipped
                    </Button>
                  </div>
                </Card>
              )
            )}
          </div>
        </div>

        {/* Cancel Order Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-lg font-bold text-[var(--admin-text-primary)] flex items-center gap-2">
                <AlertCircle className="text-[var(--admin-error-500)]" size={20} />
                Cancel Order #{order.orderNumber}?
              </h3>
              <p className="text-sm text-[var(--admin-text-secondary)]">
                Are you sure you want to cancel this order? Stock will be restored automatically.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[var(--admin-text-secondary)] mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Customer requested cancellation / Out of stock"
                  className="w-full px-3 py-2 text-sm border border-[var(--admin-border-default)] rounded-lg focus:ring-2 focus:ring-red-200 focus:outline-none"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCancelModal(false)}
                >
                  Go Back
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={updating}
                  onClick={() => handleStatusUpdate('CANCELLED')}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Order Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-red-200">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="text-red-600" size={22} />
                Delete Order #{order.orderNumber}?
              </h3>
              <p className="text-sm text-[var(--admin-text-secondary)]">
                This action is permanent and cannot be undone. All order items, payment records, and inventory locks will be deleted from the system.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={updating}
                  onClick={handleDeleteOrder}
                >
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
