'use client';

/**
 * ORA Admin Panel - Dashboard
 * ===========================
 * 
 * Main dashboard with sales summary, orders, revenue graph,
 * top products, low stock alerts, and quick actions
 */

import React, { useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from './components/AdminLayout';
import { Card, CardHeader, CardTitle, StatCard, Badge, Button, Spinner } from './components/ui';
import {
  ShoppingCart,
  Package,
  Users,
  ArrowRight,
  Plus,
  AlertTriangle,
  IndianRupee,
  Clock,
  CheckCircle,
  Truck,
  Image,
  Tag,
  Gift,
  RefreshCw,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

// ============================================
// TYPES
// ============================================

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

interface TopProduct {
  id: string;
  name: string;
  image: string;
  sales: number;
  revenue: number;
}

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  category: string;
}

// ============================================
// STATUS BADGE COMPONENT
// ============================================

const OrderStatusBadge = ({ status }: { status: string }) => {
  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
    PENDING: { variant: 'warning', label: 'Pending' },
    PROCESSING: { variant: 'info', label: 'Processing' },
    CONFIRMED: { variant: 'info', label: 'Confirmed' },
    SHIPPED: { variant: 'info', label: 'Shipped' },
    DELIVERED: { variant: 'success', label: 'Delivered' },
    CANCELLED: { variant: 'error', label: 'Cancelled' },
    RETURNED: { variant: 'secondary', label: 'Returned' },
  };

  const config = statusConfig[status] || { variant: 'secondary' as const, label: status };

  return <Badge variant={config.variant} dot>{config.label}</Badge>;
};

// ============================================
// QUICK ACTIONS COMPONENT
// ============================================

const QuickActions = () => {
  const actions = [
    { icon: Plus, label: 'Add Product', href: '/admin/v2/products/new', color: 'bg-[#d4af37]' },
    { icon: Tag, label: 'Create Discount', href: '/admin/v2/marketing/discounts/new', color: 'bg-[#d4af37]' },
    { icon: Image, label: 'Add Banner', href: '/admin/v2/content/banners/new', color: 'bg-[#3b82f6]' },
    { icon: Gift, label: 'New Coupon', href: '/admin/v2/marketing/coupons/new', color: 'bg-[#16a34a]' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#e5e7eb] hover:border-[#d4af37] hover:bg-[#fffbf0] transition-all group"
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                <Icon size={20} className="text-white" />
              </div>
              <span className="font-medium text-sm text-[#111827] group-hover:text-[#b8962e]">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};

// ============================================
// ORDER STATUS CARDS
// ============================================

interface OrderStatusCardsProps {
  stats: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
  };
}

const OrderStatusCards = ({ stats }: OrderStatusCardsProps) => {
  const statuses = [
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-[#f59e0b]', bgColor: 'bg-[#fffbeb]' },
    { label: 'Processing', value: stats.processing, icon: RefreshCw, color: 'text-[#3b82f6]', bgColor: 'bg-[#eff6ff]' },
    { label: 'Shipped', value: stats.shipped, icon: Truck, color: 'text-[#d4af37]', bgColor: 'bg-[#fffbf0]' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle, color: 'text-[#16a34a]', bgColor: 'bg-[#f0fdf4]' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statuses.map((status, index) => {
        const Icon = status.icon;
        return (
          <Link
            key={index}
            href={`/admin/v2/orders?status=${status.label.toLowerCase()}`}
            className="p-4 rounded-xl border border-[#e5e7eb] bg-white hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${status.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon size={20} className={status.color} />
              </div>
              <ArrowRight size={16} className="text-[#9ca3af] group-hover:text-[#d4af37] transition-colors" />
            </div>
            <p className="text-2xl font-bold text-[#111827]">{status.value}</p>
            <p className="text-sm text-[#9ca3af]">{status.label} Orders</p>
          </Link>
        );
      })}
    </div>
  );
};

// ============================================
// RECENT ORDERS TABLE
// ============================================

interface RecentOrdersProps {
  orders: RecentOrder[];
  loading: boolean;
}

const RecentOrders = ({ orders, loading }: RecentOrdersProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card padding="none">
      <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
        <CardTitle>Recent Orders</CardTitle>
        <Link href="/admin/v2/orders">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={16} />}>
            View All
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center">
          <Spinner />
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-[#9ca3af]">
          No orders yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f6f7f9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4b5563]">Order</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4b5563]">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#4b5563]">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#4b5563]">Total</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#4b5563]">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#f6f7f9] transition-colors">
                  <td className="px-6 py-4">
                    <Link href={`/admin/v2/orders/${order.id}`} className="font-medium text-[#d4af37] hover:underline">
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#111827]">{order.customerName}</td>
                  <td className="px-6 py-4">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-[#111827]">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-[#9ca3af]">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

// ============================================
// LOW STOCK ALERT
// ============================================

interface LowStockAlertProps {
  items: LowStockItem[];
  loading: boolean;
}

const LowStockAlert = ({ items, loading }: LowStockAlertProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#f59e0b]" />
          <CardTitle>Low Stock Alert</CardTitle>
        </div>
        <Badge variant="warning">{items.length}</Badge>
      </CardHeader>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Spinner size="sm" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-[#9ca3af] text-sm">
          All products are well stocked
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/admin/v2/products/${item.id}`}
              className="flex items-center justify-between p-3 rounded-lg bg-[#f6f7f9] hover:bg-[#fffbeb] transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[#111827] truncate group-hover:text-[#b45309]">
                  {item.name}
                </p>
                <p className="text-xs text-[#9ca3af]">{item.category}</p>
              </div>
              <div className={`
                px-2 py-1 rounded text-xs font-semibold
                ${item.stock === 0 
                  ? 'bg-[#fee2e2] text-[#991b1b]' 
                  : 'bg-[#fef3c7] text-[#b45309]'
                }
              `}>
                {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
        <Link href="/admin/v2/products/inventory">
          <Button variant="secondary" size="sm" className="w-full" rightIcon={<ArrowRight size={16} />}>
            Manage Inventory
          </Button>
        </Link>
      </div>
    </Card>
  );
};

// ============================================
// TOP SELLING PRODUCTS
// ============================================

interface TopProductsProps {
  products: TopProduct[];
  loading: boolean;
}

const TopProducts = ({ products, loading }: TopProductsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
        <Link href="/admin/v2/analytics/products">
          <Button variant="ghost" size="sm">View All</Button>
        </Link>
      </CardHeader>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Spinner size="sm" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-8 text-center text-[#9ca3af] text-sm">
          No sales data yet
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-4">
              <div className="w-6 h-6 rounded-full bg-[#fef7e0] flex items-center justify-center">
                <span className="text-xs font-bold text-[#b8962e]">{index + 1}</span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-[#f6f7f9] overflow-hidden flex-shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={20} className="text-[#9ca3af]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#111827] truncate">{product.name}</p>
                <p className="text-xs text-[#9ca3af]">{product.sales} sold</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm text-[#111827]">{formatCurrency(product.revenue)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

export default function DashboardPage() {
  const {
    stats, statsLoading, fetchDashboardStats,
    lowStockProducts, lowStockLoading, fetchLowStockProducts,
    orders, ordersLoading, fetchOrders,
    orderStatusReport, orderStatusReportLoading, fetchOrderStatusReport,
  } = useAdminStore();

  useEffect(() => {
    fetchDashboardStats();
    fetchLowStockProducts();
    fetchOrders(1); // Fetch page 1 for recent orders
    fetchOrderStatusReport(); // Get per-status counts
  }, [fetchDashboardStats, fetchLowStockProducts, fetchOrders, fetchOrderStatusReport]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Transform orders to RecentOrder format (show latest 8)
  const recentOrders: RecentOrder[] = (orders || []).slice(0, 8).map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.user?.fullName || 'Guest',
    total: Number(o.totalAmount) || 0,
    status: o.status as RecentOrder['status'],
    createdAt: o.createdAt,
  }));

  // Transform low stock products to the expected format
  const lowStockItems: LowStockItem[] = lowStockProducts.map(p => ({
    id: p.id,
    name: p.name,
    stock: p.stockQuantity,
    category: p.category?.name || 'Uncategorized',
  }));

  // Transform dashboard topProducts to the UI format
  const topProductsList: TopProduct[] = (stats?.topProducts || []).slice(0, 5).map((p) => ({
    id: p.productId,
    name: p.name,
    image: '',
    sales: p.totalSold,
    revenue: p.totalRevenue,
  }));

  // Calculate real trend: todayRevenue vs average daily revenue this month
  const avgDailyRevenue = stats?.monthRevenue ? Number(stats.monthRevenue) / 30 : 0;
  const todayRev = Number(stats?.todayRevenue) || 0;
  const revenueTrend = avgDailyRevenue > 0
    ? Math.round(((todayRev - avgDailyRevenue) / avgDailyRevenue) * 100 * 10) / 10
    : 0;

  // Order status counts from the report API
  const statusCounts = orderStatusReport?.orderStats || {};
  const pendingCount = (statusCounts['PENDING']?.count || 0);
  const processingCount = (statusCounts['CONFIRMED']?.count || 0) + (statusCounts['PROCESSING']?.count || 0);
  const shippedCount = (statusCounts['SHIPPED']?.count || 0);
  const deliveredCount = (statusCounts['DELIVERED']?.count || 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(Number(stats?.totalRevenue) || 0)}
            change={revenueTrend !== 0 ? { value: Math.abs(revenueTrend), trend: revenueTrend >= 0 ? 'up' : 'down' } : undefined}
            icon={<IndianRupee size={24} className="text-[#16a34a]" />}
            variant="success"
          />
          <StatCard
            title="Today&apos;s Orders"
            value={stats?.todayOrders || 0}
            icon={<ShoppingCart size={24} className="text-[#d4af37]" />}
            variant="primary"
          />
          <StatCard
            title="Total Customers"
            value={stats?.totalCustomers || 0}
            icon={<Users size={24} className="text-[#d4af37]" />}
            variant="gold"
          />
          <StatCard
            title="Pending Orders"
            value={stats?.pendingOrders || 0}
            icon={<Clock size={24} className="text-[#f59e0b]" />}
            variant="warning"
          />
        </div>

        {/* Order Status Cards */}
        <OrderStatusCards
          stats={{
            pending: pendingCount || (stats?.pendingOrders || 0),
            processing: processingCount,
            shipped: shippedCount,
            delivered: deliveredCount,
          }}
        />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentOrders orders={recentOrders} loading={ordersLoading || statsLoading} />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <TopProducts products={topProductsList} loading={statsLoading} />

          {/* Low Stock Alert */}
          <LowStockAlert items={lowStockItems} loading={lowStockLoading} />
        </div>
      </div>
    </AdminLayout>
  );
}
