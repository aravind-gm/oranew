'use client';

/**
 * ORA Admin Panel - Analytics Dashboard
 * ======================================
 * 
 * Real sales reports, product performance,
 * order insights, and CSV data export
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Card, Badge, Select, Spinner } from '../components/ui';
import {
  Download,
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  IndianRupee,
  ArrowUp,
  ArrowDown,
  Eye,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

// ============================================
// MINI CHART COMPONENT
// ============================================

const MiniLineChart = ({ data, color }: { data: number[]; color: string }) => {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 50" className="w-full h-12">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ============================================
// BAR CHART COMPONENT
// ============================================

const BarChart = ({ data, labels }: { data: number[]; labels: string[] }) => {
  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((value, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-[var(--admin-primary-500)] rounded-t-md transition-all hover:bg-[var(--admin-primary-600)]"
            style={{ height: `${(value / max) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
          />
          <span className="text-xs text-[var(--admin-text-muted)]">{labels[index]}</span>
        </div>
      ))}
    </div>
  );
};

// ============================================
// ANALYTICS PAGE
// ============================================

export default function AnalyticsPage() {
  const {
    stats, statsLoading, fetchDashboardStats,
    revenueReport, revenueReportLoading, fetchRevenueReport,
    orderStatusReport, orderStatusReportLoading, fetchOrderStatusReport,
    paymentReport, paymentReportLoading, fetchPaymentReport,
  } = useAdminStore();

  const [dateRange, setDateRange] = useState('daily');
  const [refreshing, setRefreshing] = useState(false);

  // Map the select values to API period params
  const periodMap: Record<string, string> = {
    '7d': 'daily',
    '30d': 'daily',
    '90d': 'weekly',
    'year': 'monthly',
  };

  const fetchAllData = useCallback(async (period: string) => {
    const apiPeriod = periodMap[period] || 'daily';
    
    // Calculate date ranges based on selection
    const endDate = new Date().toISOString();
    const startDate = new Date();
    switch (period) {
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
      default: startDate.setDate(startDate.getDate() - 7);
    }

    await Promise.all([
      fetchDashboardStats(),
      fetchRevenueReport(apiPeriod, startDate.toISOString(), endDate),
      fetchOrderStatusReport(),
      fetchPaymentReport(1),
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDashboardStats, fetchRevenueReport, fetchOrderStatusReport, fetchPaymentReport]);

  useEffect(() => {
    fetchAllData(dateRange);
  }, [dateRange, fetchAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData(dateRange);
    setRefreshing(false);
  };

  // Format helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // CSV Export: generates and downloads a CSV file from revenue chartData
  const handleExportCSV = () => {
    const chartData = revenueReport?.chartData || [];
    if (chartData.length === 0) return;

    const header = 'Date,Revenue,Orders\n';
    const rows = chartData.map(d => `${d.date},${d.revenue},${d.orders}`).join('\n');
    const csv = header + rows;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ora-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compute derived stats from real data
  const totalRevenue = Number(revenueReport?.totalRevenue || stats?.totalRevenue || 0);
  const totalOrders = revenueReport?.totalOrders || Number(stats?.totalOrders || 0);
  const averageOrderValue = revenueReport?.averageOrderValue || (totalOrders > 0 ? totalRevenue / totalOrders : 0);
  const totalCustomers = Number(stats?.totalCustomers || 0);

  const chartData = revenueReport?.chartData || [];
  const revenueData = chartData.map(d => d.revenue);
  const ordersData = chartData.map(d => d.orders);

  // Order status breakdown from report
  const orderStats = orderStatusReport?.orderStats || {};
  const statusEntries = Object.entries(orderStats).map(([status, data]) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    count: data.count,
    revenue: data.revenue,
  }));

  // Payment stats from report
  const paymentStats = paymentReport?.stats || {};
  const paymentEntries = Object.entries(paymentStats).map(([status, data]) => ({
    name: status.charAt(0) + status.slice(1).toLowerCase(),
    count: data.count,
    amount: data.amount,
  }));

  const isLoading = statsLoading || revenueReportLoading;

  if (isLoading && !stats && !revenueReport) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Analytics"
          description="Track your store&apos;s performance and insights"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Analytics' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                leftIcon={<RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                Refresh
              </Button>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                options={[
                  { value: '7d', label: 'Last 7 days' },
                  { value: '30d', label: 'Last 30 days' },
                  { value: '90d', label: 'Last 90 days' },
                  { value: 'year', label: 'This year' },
                ]}
              />
              <Button
                variant="secondary"
                leftIcon={<Download size={18} />}
                onClick={handleExportCSV}
                disabled={!chartData.length}
              >
                Export CSV
              </Button>
            </div>
          }
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Total Revenue</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)] mt-1">
                  {formatCurrency(totalRevenue)}
                </p>
                {revenueReport && (
                  <p className="text-xs text-[var(--admin-text-muted)] mt-2">
                    {revenueReport.period} &middot; {totalOrders} orders
                  </p>
                )}
              </div>
              <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                <IndianRupee size={20} className="text-[var(--admin-primary-600)]" />
              </div>
            </div>
            {revenueData.length > 1 && (
              <div className="mt-4">
                <MiniLineChart data={revenueData} color="var(--admin-primary-500)" />
              </div>
            )}
          </Card>

          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Total Orders</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)] mt-1">
                  {totalOrders}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-2">
                  Today: {stats?.todayOrders || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--admin-gold-100)] rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-[var(--admin-gold-600)]" />
              </div>
            </div>
            {ordersData.length > 1 && (
              <div className="mt-4">
                <MiniLineChart data={ordersData} color="var(--admin-gold-500)" />
              </div>
            )}
          </Card>

          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Avg Order Value</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)] mt-1">
                  {formatCurrency(Math.round(averageOrderValue))}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-2">
                  Per order average
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--admin-success-100)] rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-[var(--admin-success-600)]" />
              </div>
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Total Customers</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)] mt-1">
                  {formatNumber(totalCustomers)}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-2">
                  Registered users
                </p>
              </div>
              <div className="w-10 h-10 bg-[var(--admin-bg-tertiary)] rounded-xl flex items-center justify-center">
                <Users size={20} className="text-[var(--admin-text-muted)]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Sales Overview</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--admin-primary-500)]" />
                  <span className="text-[var(--admin-text-muted)]">Revenue</span>
                </div>
              </div>
            </div>
            {revenueReportLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            ) : chartData.length > 0 ? (
              <BarChart
                data={chartData.map(d => d.revenue)}
                labels={chartData.map(d => {
                  const date = new Date(d.date);
                  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                })}
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-[var(--admin-text-muted)]">
                No revenue data for this period
              </div>
            )}
          </Card>

          {/* Order Status Breakdown */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Order Status Breakdown</h3>
            </div>
            {orderStatusReportLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Spinner size="sm" />
              </div>
            ) : statusEntries.length > 0 ? (
              <div className="space-y-4">
                {statusEntries.map((entry) => {
                  const total = orderStatusReport?.totalOrders || 1;
                  const pct = Math.round((entry.count / total) * 100);
                  const colorMap: Record<string, string> = {
                    Pending: 'bg-[#f59e0b]',
                    Confirmed: 'bg-[#3b82f6]',
                    Processing: 'bg-[#3b82f6]',
                    Shipped: 'bg-[#d4af37]',
                    Delivered: 'bg-[#16a34a]',
                    Cancelled: 'bg-[#ef4444]',
                    Returned: 'bg-[#9ca3af]',
                    Refunded: 'bg-[#9ca3af]',
                  };
                  return (
                    <div key={entry.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[var(--admin-text-primary)]">{entry.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[var(--admin-text-primary)]">{entry.count}</span>
                          <span className="text-xs text-[var(--admin-text-muted)]">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-[var(--admin-bg-tertiary)] rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colorMap[entry.name] || 'bg-[#9ca3af]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-[var(--admin-text-muted)]">
                No order data available
              </div>
            )}
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[var(--admin-text-primary)]">Top Performing Products</h3>
          </div>
          {statsLoading ? (
            <div className="py-8 flex justify-center">
              <Spinner size="sm" />
            </div>
          ) : (stats?.topProducts || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--admin-border)]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Product</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Units Sold</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]">
                  {(stats?.topProducts || []).map((product, index) => (
                    <tr key={product.productId} className="hover:bg-[var(--admin-bg-secondary)]">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-[var(--admin-text-muted)]">#{index + 1}</span>
                          <div className="w-10 h-10 bg-[var(--admin-bg-tertiary)] rounded-lg flex items-center justify-center">
                            <Package size={18} className="text-[var(--admin-text-muted)]" />
                          </div>
                          <span className="font-medium text-[var(--admin-text-primary)]">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium text-[var(--admin-text-primary)]">{product.totalSold}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-medium text-[var(--admin-text-primary)]">{formatCurrency(product.totalRevenue)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[var(--admin-text-muted)]">
              No product performance data yet
            </div>
          )}
        </Card>

        {/* Payment Stats */}
        {paymentEntries.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Payment Summary</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {paymentEntries.map((entry) => {
                const colorMap: Record<string, string> = {
                  Confirmed: 'text-[#16a34a]',
                  Pending: 'text-[#f59e0b]',
                  Failed: 'text-[#ef4444]',
                  Refunded: 'text-[#9ca3af]',
                };
                return (
                  <div key={entry.name} className="p-4 rounded-xl border border-[var(--admin-border)]">
                    <p className="text-sm text-[var(--admin-text-muted)]">{entry.name}</p>
                    <p className={`text-xl font-bold mt-1 ${colorMap[entry.name] || 'text-[var(--admin-text-primary)]'}`}>
                      {entry.count}
                    </p>
                    <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                      {formatCurrency(entry.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
