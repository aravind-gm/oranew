'use client';

/**
 * ============================================================================
 * ORA JEWELLERY — ADMIN DASHBOARD KPIs (Phase 3B)
 * ============================================================================
 * 
 * Premium admin dashboard with:
 * - Revenue KPIs (Total, Monthly, Today)
 * - Order stats (Total, Pending, Today)
 * - Low stock product count
 * - Revenue trend chart (Recharts)
 * - Top 5 selling products
 * - Visually premium dark theme
 */

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Home,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  todayOrders: number;
  todayRevenue: number;
  lowStockCount: number;
  monthRevenue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  revenueChart: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.push('/admin/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard/stats');
        setData(response.data.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  if (user?.role !== 'ADMIN') return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">ORA Dashboard</h1>
              <p className="text-xs text-gray-400">Business Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2">
              <Home size={18} />
              <span className="hidden sm:inline">Store</span>
            </Link>
            <Link href="/admin" className="text-gray-400 hover:text-white transition text-sm">
              Admin Panel
            </Link>
            <button
              onClick={() => { logout(); router.push('/'); }}
              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <>
            {/* ============================================
                PRIMARY KPI CARDS
                ============================================ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold">{formatCurrency(Number(data.totalRevenue))}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                </div>
                <p className="mt-3 text-emerald-200 text-sm">From confirmed orders</p>
              </div>

              {/* Revenue This Month */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Revenue This Month</p>
                    <p className="text-3xl font-bold">{formatCurrency(Number(data.monthRevenue))}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <p className="mt-3 text-blue-200 text-sm">
                  Today: {formatCurrency(Number(data.todayRevenue))}
                </p>
              </div>

              {/* Orders Today */}
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Orders Today</p>
                    <p className="text-3xl font-bold">{data.todayOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={24} />
                  </div>
                </div>
                <p className="mt-3 text-purple-200 text-sm">
                  Total: {data.totalOrders} orders
                </p>
              </div>

              {/* Pending Orders */}
              <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm mb-1">Pending Orders</p>
                    <p className="text-3xl font-bold">{data.pendingOrders}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500/30 rounded-lg flex items-center justify-center">
                    <Package size={24} />
                  </div>
                </div>
                <Link href="/admin/orders?status=PENDING" className="mt-3 flex items-center gap-1 text-amber-200 text-sm hover:underline">
                  View pending <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* ============================================
                SECONDARY KPI CARDS
                ============================================ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Customers */}
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Total Customers</p>
                    <p className="text-2xl font-bold">{data.totalCustomers}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                    <Users size={20} className="text-indigo-400" />
                  </div>
                </div>
              </div>

              {/* Low Stock Products */}
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Low Stock Products</p>
                    <p className="text-2xl font-bold text-amber-400">{data.lowStockCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle size={20} className="text-amber-400" />
                  </div>
                </div>
                <Link href="/admin/inventory" className="mt-3 flex items-center gap-1 text-amber-400 text-sm hover:underline">
                  Manage inventory <ArrowUpRight size={14} />
                </Link>
              </div>

              {/* Average Order Value */}
              <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Avg. Order Value</p>
                    <p className="text-2xl font-bold">
                      {data.totalOrders > 0
                        ? formatCurrency(Number(data.totalRevenue) / data.totalOrders)
                        : '₹0'}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 size={20} className="text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================
                CHARTS ROW
                ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-400" />
                  Revenue Trend (Last 30 Days)
                </h2>
                {data.revenueChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.revenueChart}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatShortDate}
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Revenue']}
                        labelFormatter={(label: unknown) => formatShortDate(String(label))}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-gray-500">
                    <p>No revenue data yet</p>
                  </div>
                )}
              </div>

              {/* Top 5 Selling Products */}
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-amber-400" />
                  Top 5 Products
                </h2>
                {data.topProducts.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-6">
                      {data.topProducts.map((product, index) => (
                        <div key={product.productId} className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-amber-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-700 text-white' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-gray-400">
                              {product.totalSold} sold • {formatCurrency(product.totalRevenue)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={150}>
                      <BarChart data={data.topProducts.slice(0, 5)}>
                        <XAxis dataKey="name" hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff',
                          }}
                          formatter={(value: number | undefined) => [value ?? 0, 'Units Sold']}
                        />
                        <Bar dataKey="totalSold" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    <p>No sales data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================
                QUICK ACTIONS
                ============================================ */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { href: '/admin/products', icon: Package, label: 'Products', color: 'amber' },
                  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', color: 'emerald' },
                  { href: '/admin/inventory', icon: Package, label: 'Inventory', color: 'cyan' },
                  { href: '/admin/reports', icon: BarChart3, label: 'Reports', color: 'purple' },
                  { href: '/admin/categories', icon: Package, label: 'Categories', color: 'blue' },
                  { href: '/admin/returns', icon: Package, label: 'Returns', color: 'orange' },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-xl p-4 text-center transition group"
                  >
                    <action.icon size={24} className={`mx-auto mb-2 text-${action.color}-400 group-hover:text-${action.color}-300`} />
                    <p className="text-sm font-medium">{action.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p>Failed to load dashboard data</p>
          </div>
        )}
      </div>
    </div>
  );
}
