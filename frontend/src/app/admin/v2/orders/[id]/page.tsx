'use client';

/**
 * ORA Admin Panel - Order Details Page
 * =====================================
 * 
 * Complete order view with:
 * - Customer info
 * - Product details
 * - Payment & shipping status
 * - Status updates
 * - Email triggers
 * - Invoice download
 * - Refund management
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  customer: {
    id: string;
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
  items: {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
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
// STATUS BADGE
// ============================================

const OrderStatusBadge = ({ status }: { status: OrderDetails['status'] }) => {
  const config: Record<OrderDetails['status'], { variant: 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'primary'; label: string }> = {
    PENDING: { variant: 'warning', label: 'Pending' },
    CONFIRMED: { variant: 'info', label: 'Confirmed' },
    PROCESSING: { variant: 'info', label: 'Processing' },
    SHIPPED: { variant: 'primary', label: 'Shipped' },
    DELIVERED: { variant: 'success', label: 'Delivered' },
    CANCELLED: { variant: 'error', label: 'Cancelled' },
    RETURNED: { variant: 'secondary', label: 'Returned' },
    REFUNDED: { variant: 'secondary', label: 'Refunded' },
  };

  const { variant, label } = config[status];
  return <Badge variant={variant} size="md">{label}</Badge>;
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
          {/* Line */}
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

          {/* Content */}
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
  const [updating, setUpdating] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // TODO: API call to fetch order
        // Simulating API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data for now
        setOrder({
          id: orderId,
          orderNumber: 'ORD-2024-0001',
          status: 'CONFIRMED',
          paymentStatus: 'CONFIRMED',
          paymentMethod: 'Razorpay',
          customer: {
            id: 'cust-1',
            name: 'Priya Sharma',
            email: 'priya@example.com',
            phone: '9842253984',
          },
          shippingAddress: {
            fullName: 'Priya Sharma',
            phone: '9842253984',
            addressLine1: '123, Rose Garden Apartments',
            addressLine2: 'MG Road, Indiranagar',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560038',
            country: 'India',
          },
          billingAddress: {
            fullName: 'Priya Sharma',
            phone: '9842253984',
            addressLine1: '123, Rose Garden Apartments',
            addressLine2: 'MG Road, Indiranagar',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560038',
            country: 'India',
          },
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Gold Diamond Necklace - Eternal Rose',
              productImage: '',
              quantity: 1,
              unitPrice: 45000,
              totalPrice: 45000,
            },
            {
              id: 'item-2',
              productId: 'prod-2',
              productName: 'Matching Diamond Earrings',
              productImage: '',
              quantity: 1,
              unitPrice: 25000,
              totalPrice: 25000,
            },
          ],
          subtotal: 70000,
          discountAmount: 5000,
          couponCode: 'WELCOME10',
          gstAmount: 1170,
          shippingFee: 0,
          totalAmount: 66170,
          createdAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error fetching order:', error);
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

  // Handle status update
  const handleStatusUpdate = async (newStatus: OrderDetails['status']) => {
    setUpdating(true);
    try {
      // TODO: API call to update status
      await new Promise(resolve => setTimeout(resolve, 500));
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Generate timeline events
  const getTimelineEvents = (): TimelineEvent[] => {
    if (!order) return [];

    const events: TimelineEvent[] = [
      {
        id: 'placed',
        status: 'PLACED',
        title: 'Order Placed',
        description: 'Order was placed by customer',
        timestamp: order.createdAt,
        completed: true,
      },
      {
        id: 'confirmed',
        status: 'CONFIRMED',
        title: 'Order Confirmed',
        description: 'Payment verified and order confirmed',
        timestamp: order.createdAt,
        completed: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        current: order.status === 'CONFIRMED',
      },
      {
        id: 'processing',
        status: 'PROCESSING',
        title: 'Processing',
        description: 'Order is being prepared',
        timestamp: '',
        completed: ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status),
        current: order.status === 'PROCESSING',
      },
      {
        id: 'shipped',
        status: 'SHIPPED',
        title: 'Shipped',
        description: order.trackingNumber ? `Tracking: ${order.trackingNumber}` : 'Package has been shipped',
        timestamp: order.shippedAt || '',
        completed: ['SHIPPED', 'DELIVERED'].includes(order.status),
        current: order.status === 'SHIPPED',
      },
      {
        id: 'delivered',
        status: 'DELIVERED',
        title: 'Delivered',
        description: 'Package delivered successfully',
        timestamp: order.deliveredAt || '',
        completed: order.status === 'DELIVERED',
        current: order.status === 'DELIVERED',
      },
    ];

    return events;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-[var(--admin-error-500)] mb-4" />
          <h2 className="text-xl font-semibold text-[var(--admin-text-primary)] mb-2">Order Not Found</h2>
          <p className="text-[var(--admin-text-muted)] mb-4">The order you're looking for doesn't exist.</p>
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
        <PageHeader
          title={`Order #${order.orderNumber}`}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Orders', href: '/admin/v2/orders' },
            { label: `#${order.orderNumber}` },
          ]}
          actions={
            <>
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => router.back()}
              >
                Back
              </Button>
              <Button variant="secondary" leftIcon={<Printer size={18} />}>
                Print
              </Button>
              <Button variant="secondary" leftIcon={<Download size={18} />}>
                Invoice
              </Button>
              <Button variant="secondary" leftIcon={<Mail size={18} />}>
                Email
              </Button>
            </>
          }
        />

        {/* Status Bar */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Order Status</p>
                <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
              </div>
              <div className="h-8 w-px bg-[var(--admin-border-light)]" />
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Payment</p>
                <div className="mt-1">
                  <Badge variant={order.paymentStatus === 'CONFIRMED' ? 'success' : 'warning'}>
                    {order.paymentStatus === 'CONFIRMED' ? 'Paid' : order.paymentStatus}
                  </Badge>
                </div>
              </div>
              <div className="h-8 w-px bg-[var(--admin-border-light)]" />
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Date</p>
                <p className="font-medium text-[var(--admin-text-primary)]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {order.status === 'PENDING' && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('CONFIRMED')}
                  isLoading={updating}
                  leftIcon={<CheckCircle size={16} />}
                >
                  Confirm Order
                </Button>
              )}
              {(order.status === 'CONFIRMED' || order.status === 'PROCESSING') && (
                <Button
                  size="sm"
                  onClick={() => handleStatusUpdate('SHIPPED')}
                  isLoading={updating}
                  leftIcon={<Truck size={16} />}
                >
                  Mark as Shipped
                </Button>
              )}
              {order.status === 'SHIPPED' && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleStatusUpdate('DELIVERED')}
                  isLoading={updating}
                  leftIcon={<Package size={16} />}
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
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardTitle className="mb-4">Order Items</CardTitle>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-[var(--admin-border-light)] last:border-0 last:pb-0">
                    <div className="w-16 h-16 bg-[var(--admin-bg-secondary)] rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package size={24} className="text-[var(--admin-text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/admin/v2/products/${item.productId}`}
                        className="font-medium text-[var(--admin-text-primary)] hover:text-[var(--admin-primary-600)] hover:underline"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-sm text-[var(--admin-text-muted)] mt-1">
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--admin-text-primary)]">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
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
                  <span className="text-[var(--admin-text-muted)]">GST (18%)</span>
                  <span className="text-[var(--admin-text-primary)]">{formatCurrency(order.gstAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--admin-text-muted)]">Shipping</span>
                  <span className="text-[var(--admin-text-primary)]">
                    {order.shippingFee === 0 ? 'Free' : formatCurrency(order.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[var(--admin-border-light)]">
                  <span className="font-semibold text-[var(--admin-text-primary)]">Total</span>
                  <span className="font-bold text-lg text-[var(--admin-text-primary)]">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </Card>

            {/* Shipping & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Truck size={18} className="text-[var(--admin-text-muted)]" />
                  <CardTitle>Shipping Address</CardTitle>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-[var(--admin-text-primary)]">{order.shippingAddress.fullName}</p>
                  <p className="text-[var(--admin-text-secondary)]">{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="text-[var(--admin-text-secondary)]">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-[var(--admin-text-secondary)]">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                  </p>
                  <p className="text-[var(--admin-text-muted)]">{order.shippingAddress.country}</p>
                  <p className="flex items-center gap-2 text-[var(--admin-text-secondary)] mt-3">
                    <Phone size={14} />
                    {order.shippingAddress.phone}
                  </p>
                </div>
              </Card>

              {/* Payment Info */}
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={18} className="text-[var(--admin-text-muted)]" />
                  <CardTitle>Payment Information</CardTitle>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Method</span>
                    <span className="text-[var(--admin-text-primary)]">{order.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Status</span>
                    <Badge variant={order.paymentStatus === 'CONFIRMED' ? 'success' : 'warning'}>
                      {order.paymentStatus === 'CONFIRMED' ? 'Paid' : order.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Amount</span>
                    <span className="font-semibold text-[var(--admin-text-primary)]">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                {order.paymentStatus === 'CONFIRMED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full mt-4"
                    leftIcon={<RotateCcw size={16} />}
                  >
                    Process Refund
                  </Button>
                )}
              </Card>
            </div>

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardTitle className="mb-4">Order Notes</CardTitle>
                <p className="text-sm text-[var(--admin-text-secondary)]">{order.notes}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <User size={18} className="text-[var(--admin-text-muted)]" />
                <CardTitle>Customer</CardTitle>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--admin-primary-100)] flex items-center justify-center">
                    <span className="font-semibold text-[var(--admin-primary-600)]">
                      {order.customer.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--admin-text-primary)]">{order.customer.name}</p>
                    <Link 
                      href={`/admin/v2/customers/${order.customer.id}`}
                      className="text-xs text-[var(--admin-primary-600)] hover:underline"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
                <div className="pt-3 border-t border-[var(--admin-border-light)] space-y-2 text-sm">
                  <p className="flex items-center gap-2 text-[var(--admin-text-secondary)]">
                    <Mail size={14} className="text-[var(--admin-text-muted)]" />
                    {order.customer.email}
                  </p>
                  <p className="flex items-center gap-2 text-[var(--admin-text-secondary)]">
                    <Phone size={14} className="text-[var(--admin-text-muted)]" />
                    {order.customer.phone}
                  </p>
                </div>
              </div>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardTitle className="mb-4">Order Timeline</CardTitle>
              <OrderTimeline events={getTimelineEvents()} />
            </Card>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <Card>
                <CardTitle className="mb-4">Shipping Tracking</CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Courier</span>
                    <span className="text-[var(--admin-text-primary)]">{order.courierName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--admin-text-muted)]">Tracking #</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--admin-text-primary)] font-mono">{order.trackingNumber}</span>
                      <button className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" rightIcon={<ExternalLink size={14} />}>
                    Track Package
                  </Button>
                </div>
              </Card>
            )}

            {/* Add Tracking (if not shipped yet) */}
            {order.status === 'PROCESSING' && !order.trackingNumber && (
              <Card>
                <CardTitle className="mb-4">Add Tracking</CardTitle>
                <div className="space-y-3">
                  <Select
                    label="Courier"
                    options={[
                      { value: '', label: 'Select Courier' },
                      { value: 'bluedart', label: 'BlueDart' },
                      { value: 'delhivery', label: 'Delhivery' },
                      { value: 'ecom', label: 'Ecom Express' },
                      { value: 'dtdc', label: 'DTDC' },
                    ]}
                  />
                  <div>
                    <label className="block mb-1.5 text-sm font-medium text-[var(--admin-text-primary)]">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      placeholder="Enter tracking number"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--admin-border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-200)] focus:border-[var(--admin-primary-500)]"
                    />
                  </div>
                  <Button className="w-full" leftIcon={<Truck size={16} />}>
                    Add & Mark Shipped
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
