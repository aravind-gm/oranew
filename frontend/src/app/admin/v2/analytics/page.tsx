'use client';

/**
 * ORA Admin Panel - Analytics Dashboard
 * ======================================
 * 
 * Sales reports, product performance,
 * customer insights, and data export
 */

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Card, Badge, Select, StatCard, Spinner } from '../components/ui';
import {
  Download,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Package,
  IndianRupee,
  Calendar,
  ArrowUp,
  ArrowDown,
  Eye,
  ShoppingCart,
  CreditCard,
  BarChart3,
  PieChart,
  LineChart,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  image?: string;
  sold: number;
  revenue: number;
  views: number;
  conversionRate: number;
}

interface CustomerSegment {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

// ============================================
// MINI CHART COMPONENT
// ============================================

const MiniLineChart = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
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
  const max = Math.max(...data);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((value, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-[var(--admin-primary-500)] rounded-t-md transition-all hover:bg-[var(--admin-primary-600)]"
            style={{ height: `${(value / max) * 100}%` }}
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
  // State
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data
  const [stats, setStats] = useState({
    totalRevenue: 1245000,
    revenueChange: 12.5,
    totalOrders: 156,
    ordersChange: 8.2,
    avgOrderValue: 7981,
    aovChange: -2.3,
    conversionRate: 3.2,
    conversionChange: 0.4,
    totalVisitors: 4875,
    visitorsChange: 15.8,
    newCustomers: 45,
    newCustomersChange: 22.1,
  });

  const [dailySales, setDailySales] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock daily sales
        setDailySales([
          { date: '2024-06-01', revenue: 145000, orders: 18, avgOrderValue: 8056 },
          { date: '2024-06-02', revenue: 178000, orders: 22, avgOrderValue: 8091 },
          { date: '2024-06-03', revenue: 132000, orders: 15, avgOrderValue: 8800 },
          { date: '2024-06-04', revenue: 195000, orders: 25, avgOrderValue: 7800 },
          { date: '2024-06-05', revenue: 167000, orders: 21, avgOrderValue: 7952 },
          { date: '2024-06-06', revenue: 189000, orders: 24, avgOrderValue: 7875 },
          { date: '2024-06-07', revenue: 239000, orders: 31, avgOrderValue: 7710 },
        ]);

        // Mock top products
        setTopProducts([
          { id: '1', name: 'Diamond Solitaire Ring', sold: 45, revenue: 675000, views: 1250, conversionRate: 3.6 },
          { id: '2', name: 'Pearl Necklace Set', sold: 38, revenue: 342000, views: 980, conversionRate: 3.9 },
          { id: '3', name: 'Gold Hoop Earrings', sold: 52, revenue: 208000, views: 1100, conversionRate: 4.7 },
          { id: '4', name: 'Emerald Pendant', sold: 28, revenue: 196000, views: 720, conversionRate: 3.9 },
          { id: '5', name: 'Rose Gold Bracelet', sold: 35, revenue: 175000, views: 890, conversionRate: 3.9 },
        ]);

        // Mock customer segments
        setCustomerSegments([
          { name: 'New Customers', count: 245, percentage: 35, color: 'var(--admin-primary-500)' },
          { name: 'Returning', count: 312, percentage: 45, color: 'var(--admin-gold-500)' },
          { name: 'VIP', count: 89, percentage: 13, color: 'var(--admin-success-500)' },
          { name: 'At Risk', count: 54, percentage: 7, color: 'var(--admin-error-500)' },
        ]);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Export handlers
  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log('Exporting CSV...');
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF...');
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Analytics"
          description="Track your store's performance and insights"
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
              <Button variant="secondary" leftIcon={<Download size={18} />} onClick={handleExportCSV}>
                Export
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
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${stats.revenueChange >= 0 ? 'text-[var(--admin-success-600)]' : 'text-[var(--admin-error-600)]'}`}>
                  {stats.revenueChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {Math.abs(stats.revenueChange)}% vs last period
                </div>
              </div>
              <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                <IndianRupee size={20} className="text-[var(--admin-primary-600)]" />
              </div>
            </div>
            <div className="mt-4">
              <MiniLineChart
                data={dailySales.map(d => d.revenue)}
                color="var(--admin-primary-500)"
              />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Total Orders</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)] mt-1">
                  {stats.totalOrders}
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${stats.ordersChange >= 0 ? 'text-[var(--admin-success-600)]' : 'text-[var(--admin-error-600)]'}`}>
                  {stats.ordersChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {Math.abs(stats.ordersChange)}% vs last period
                </div>
              </div>
              <div className="w-10 h-10 bg-[var(--admin-gold-100)] rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-[var(--admin-gold-600)]" />
              </div>
            </div>
            <div className="mt-4">
              <MiniLineChart
                data={dailySales.map(d => d.orders)}
                color="var(--admin-gold-500)"
              />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Avg Order Value</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)] mt-1">
                  {formatCurrency(stats.avgOrderValue)}
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${stats.aovChange >= 0 ? 'text-[var(--admin-success-600)]' : 'text-[var(--admin-error-600)]'}`}>
                  {stats.aovChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {Math.abs(stats.aovChange)}% vs last period
                </div>
              </div>
              <div className="w-10 h-10 bg-[var(--admin-success-100)] rounded-xl flex items-center justify-center">
                <CreditCard size={20} className="text-[var(--admin-success-600)]" />
              </div>
            </div>
            <div className="mt-4">
              <MiniLineChart
                data={dailySales.map(d => d.avgOrderValue)}
                color="var(--admin-success-500)"
              />
            </div>
          </Card>

          <Card padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Conversion Rate</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)] mt-1">
                  {stats.conversionRate}%
                </p>
                <div className={`flex items-center gap-1 mt-2 text-sm ${stats.conversionChange >= 0 ? 'text-[var(--admin-success-600)]' : 'text-[var(--admin-error-600)]'}`}>
                  {stats.conversionChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {Math.abs(stats.conversionChange)}% vs last period
                </div>
              </div>
              <div className="w-10 h-10 bg-[var(--admin-bg-tertiary)] rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-[var(--admin-text-muted)]" />
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
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--admin-gold-500)]" />
                  <span className="text-[var(--admin-text-muted)]">Orders</span>
                </div>
              </div>
            </div>
            <BarChart
              data={dailySales.map(d => d.revenue)}
              labels={dailySales.map(d => new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }))}
            />
          </Card>

          {/* Customer Segments */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Customer Segments</h3>
            </div>
            <div className="flex items-center gap-8">
              {/* Donut Chart Placeholder */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {customerSegments.reduce((acc, segment, index) => {
                    const offset = acc.offset;
                    const dashArray = (segment.percentage / 100) * 251.2;
                    acc.elements.push(
                      <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={`${dashArray} 251.2`}
                        strokeDashoffset={-offset}
                      />
                    );
                    acc.offset += dashArray;
                    return acc;
                  }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--admin-text-primary)]">700</p>
                    <p className="text-xs text-[var(--admin-text-muted)]">Total</p>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex-1 space-y-3">
                {customerSegments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm text-[var(--admin-text-primary)]">{segment.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-[var(--admin-text-primary)]">{segment.count}</span>
                      <span className="text-xs text-[var(--admin-text-muted)] ml-2">({segment.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-[var(--admin-text-primary)]">Top Performing Products</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Product</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Units Sold</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Revenue</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Views</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {topProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-[var(--admin-bg-secondary)]">
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
                      <span className="font-medium text-[var(--admin-text-primary)]">{product.sold}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-medium text-[var(--admin-text-primary)]">{formatCurrency(product.revenue)}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 text-[var(--admin-text-muted)]">
                        <Eye size={14} />
                        <span>{formatNumber(product.views)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Badge variant={product.conversionRate >= 4 ? 'success' : product.conversionRate >= 3 ? 'warning' : 'secondary'}>
                        {product.conversionRate}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quick Reports */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-[var(--admin-primary-600)]" />
              </div>
              <div>
                <h4 className="font-medium text-[var(--admin-text-primary)]">Sales Report</h4>
                <p className="text-sm text-[var(--admin-text-muted)]">Detailed sales breakdown</p>
              </div>
            </div>
          </Card>
          <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--admin-gold-100)] rounded-xl flex items-center justify-center">
                <Package size={24} className="text-[var(--admin-gold-600)]" />
              </div>
              <div>
                <h4 className="font-medium text-[var(--admin-text-primary)]">Inventory Report</h4>
                <p className="text-sm text-[var(--admin-text-muted)]">Stock levels and movement</p>
              </div>
            </div>
          </Card>
          <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--admin-success-100)] rounded-xl flex items-center justify-center">
                <Users size={24} className="text-[var(--admin-success-600)]" />
              </div>
              <div>
                <h4 className="font-medium text-[var(--admin-text-primary)]">Customer Report</h4>
                <p className="text-sm text-[var(--admin-text-muted)]">Customer insights & behavior</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
