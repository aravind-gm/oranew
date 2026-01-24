'use client';

import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    DollarSign,
    Home,
    Layers,
    Package,
    RotateCcw,
    ShoppingCart,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const router = useRouter();
  const { token, user, logout, isHydrated } = useAuthStore();
  const { stats, statsLoading, fetchDashboardStats, lowStockProducts, lowStockLoading, fetchLowStockProducts, error } = useAdminStore();

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      console.log('[Admin Dashboard] ⚠️ Unauthorized access - redirecting to login', { hasToken: !!token, userRole: user?.role });
      router.push('/admin/login');
    }
  }, [isHydrated, token, user, router]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (token && user?.role === 'ADMIN') {
      console.log('[Admin Dashboard] 📊 Fetching dashboard data...', { user: user.email });
      fetchDashboardStats();
      fetchLowStockProducts();
    }
  }, [isHydrated, token, user, fetchDashboardStats, fetchLowStockProducts]);

  // Log stats when they change
  useEffect(() => {
    if (stats) {
      console.log('[Admin Dashboard] ✅ Stats loaded:', stats);
    }
  }, [stats]);

  useEffect(() => {
    if (error) {
      console.error('[Admin Dashboard] ❌ Error:', error);
    }
  }, [error]);

  // Show loading state during hydration instead of blank screen
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated (after hydration)
  if (!token || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => useAdminStore.getState().clearError()}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">ORA Admin</h1>
              <p className="text-xs text-gray-400">Welcome back, {user?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition flex items-center gap-2">
              <Home size={18} />
              <span className="hidden sm:inline">View Store</span>
            </Link>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Orders</p>
                <p className="text-3xl font-bold">
                  {statsLoading ? (
                    <span className="inline-block w-16 h-8 bg-blue-500/50 rounded animate-pulse" />
                  ) : (
                    stats?.totalOrders || 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <ShoppingCart size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-blue-100 text-sm">
              <span>{stats?.pendingOrders || 0} pending</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">
                  {statsLoading ? (
                    <span className="inline-block w-24 h-8 bg-emerald-500/50 rounded animate-pulse" />
                  ) : (
                    formatCurrency(Number(stats?.totalRevenue) || 0)
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-4 text-emerald-100 text-sm">
              From delivered orders
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Customers</p>
                <p className="text-3xl font-bold">
                  {statsLoading ? (
                    <span className="inline-block w-16 h-8 bg-purple-500/50 rounded animate-pulse" />
                  ) : (
                    stats?.totalCustomers || 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-4 text-purple-100 text-sm">
              Registered users
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-orange-600 p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm mb-1">Pending Orders</p>
                <p className="text-3xl font-bold">
                  {statsLoading ? (
                    <span className="inline-block w-12 h-8 bg-amber-500/50 rounded animate-pulse" />
                  ) : (
                    stats?.pendingOrders || 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500/30 rounded-lg flex items-center justify-center">
                <Package size={24} />
              </div>
            </div>
            <Link href="/admin/orders?status=PENDING" className="mt-4 flex items-center gap-1 text-amber-100 text-sm hover:underline">
              View pending <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Quick Actions & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/admin/products"
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-amber-500/50 hover:bg-gray-750 transition group"
              >
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-500/30 transition">
                  <Package size={20} className="text-amber-500" />
                </div>
                <p className="font-semibold">Products</p>
                <p className="text-xs text-gray-400 mt-1">Manage inventory</p>
              </Link>

              <Link
                href="/admin/categories"
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-blue-500/50 hover:bg-gray-750 transition group"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-500/30 transition">
                  <Layers size={20} className="text-blue-500" />
                </div>
                <p className="font-semibold">Categories</p>
                <p className="text-xs text-gray-400 mt-1">Organize products</p>
              </Link>

              <Link
                href="/admin/orders"
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-emerald-500/50 hover:bg-gray-750 transition group"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-emerald-500/30 transition">
                  <ShoppingCart size={20} className="text-emerald-500" />
                </div>
                <p className="font-semibold">Orders</p>
                <p className="text-xs text-gray-400 mt-1">View & process</p>
              </Link>

              <Link
                href="/admin/inventory"
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-cyan-500/50 hover:bg-gray-750 transition group"
              >
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-cyan-500/30 transition">
                  <Package size={20} className="text-cyan-500" />
                </div>
                <p className="font-semibold">Inventory</p>
                <p className="text-xs text-gray-400 mt-1">Manage stock</p>
              </Link>

              <Link
                href="/admin/returns"
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-orange-500/50 hover:bg-gray-750 transition group"
              >
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-500/30 transition">
                  <RotateCcw size={20} className="text-orange-500" />
                </div>
                <p className="font-semibold">Returns</p>
                <p className="text-xs text-gray-400 mt-1">Process refunds</p>
              </Link>

              <Link
                href="/admin/reports"
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-purple-500/50 hover:bg-gray-750 transition group"
              >
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-500/30 transition">
                  <BarChart3 size={20} className="text-purple-500" />
                </div>
                <p className="font-semibold">Reports</p>
                <p className="text-xs text-gray-400 mt-1">View analytics</p>
              </Link>

              <Link
                href="/"
                className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-gray-500/50 hover:bg-gray-750 transition group"
              >
                <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-500/30 transition">
                  <Home size={20} className="text-gray-400" />
                </div>
                <p className="font-semibold">Store</p>
                <p className="text-xs text-gray-400 mt-1">View storefront</p>
              </Link>
            </div>
          </div>

          {/* Low Stock Alert */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Low Stock Alert
            </h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 max-h-64 overflow-y-auto">
              {lowStockLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : lowStockProducts.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">
                  No low stock items
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-gray-750 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-gray-400">{product.category?.name || 'No category'}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        product.stockQuantity === 0 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {product.stockQuantity === 0 ? 'Out' : product.stockQuantity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
