'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { BarChart3, Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface RevenueData {
  period: string;
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  chartData: Array<{ date: string; revenue: number; orders: number }>;
}

interface OrderStats {
  [key: string]: { count: number; revenue: number };
}

interface PaymentStats {
  [key: string]: { count: number; amount: number };
}

export default function ReportsPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const [revenueRes, ordersRes, paymentsRes] = await Promise.all([
        api.get('/admin/reports/revenue', { params: { period } }),
        api.get('/admin/reports/orders'),
        api.get('/admin/reports/payments', { params: { limit: 10 } }),
      ]);

      if (revenueRes.data.success) {
        setRevenueData(revenueRes.data.data);
      }
      if (ordersRes.data.success) {
        setOrderStats(ordersRes.data.data.orderStats);
      }
      if (paymentsRes.data.success) {
        setPaymentStats(paymentsRes.data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    fetchReports();
  }, [isHydrated, token, user, router, fetchReports]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'CONFIRMED':
        return 'bg-green-500/20 text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'CANCELLED':
      case 'FAILED':
        return 'bg-red-500/20 text-red-400';
      case 'SHIPPED':
      case 'PROCESSING':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  const maxRevenue = revenueData?.chartData?.length
    ? Math.max(...revenueData.chartData.map((d) => d.revenue))
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/admin" className="text-blue-400 hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="text-emerald-500" />
              Reports & Analytics
            </h1>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="text-gray-400" size={20} />
            <span className="text-gray-400">Period:</span>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reports...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(revenueData?.totalRevenue || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                    <DollarSign size={24} />
                  </div>
                </div>
                <p className="text-emerald-100 text-sm mt-4">
                  {period === 'daily' ? 'Last 30 days' : period === 'weekly' ? 'Last 7 days' : 'This month'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Total Orders</p>
                    <p className="text-3xl font-bold">{revenueData?.totalOrders || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                    <ShoppingCart size={24} />
                  </div>
                </div>
                <p className="text-blue-100 text-sm mt-4">Confirmed payments</p>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Avg. Order Value</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(revenueData?.averageOrderValue || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <p className="text-purple-100 text-sm mt-4">Per transaction</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-6">Revenue Trend</h2>
              {revenueData?.chartData && revenueData.chartData.length > 0 ? (
                <div className="h-64 flex items-end gap-2">
                  {revenueData.chartData.map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div className="relative w-full">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t hover:from-emerald-500 hover:to-emerald-300 transition-all"
                          style={{
                            height: `${maxRevenue > 0 ? (day.revenue / maxRevenue) * 200 : 0}px`,
                            minHeight: day.revenue > 0 ? '4px' : '0px',
                          }}
                        />
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 px-2 py-1 rounded text-xs whitespace-nowrap">
                          {formatCurrency(day.revenue)} ({day.orders} orders)
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                        {new Date(day.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No data available for this period
                </div>
              )}
            </div>

            {/* Order Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Orders by Status</h2>
                {orderStats ? (
                  <div className="space-y-4">
                    {Object.entries(orderStats).map(([status, data]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{data.count}</span>
                          <span className="text-gray-400 ml-2">orders</span>
                          <span className="text-gray-500 ml-4">{formatCurrency(data.revenue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No order data available</p>
                )}
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Payments by Status</h2>
                {paymentStats ? (
                  <div className="space-y-4">
                    {Object.entries(paymentStats).map(([status, data]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{data.count}</span>
                          <span className="text-gray-400 ml-2">payments</span>
                          <span className="text-gray-500 ml-4">{formatCurrency(data.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No payment data available</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
