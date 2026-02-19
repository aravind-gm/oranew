'use client';

/**
 * ORA Admin — Phase 3 Analytics Dashboard
 * =========================================
 *
 * Comprehensive business intelligence:
 *  • Revenue clarity (today / month / 30d / growth)
 *  • Order insights (AOV, repeat rate)
 *  • Product performance (top 10, category, low stock)
 *  • Payment health (success rate, retries, failures)
 *  • Cart recovery (abandoned, recovered, coupons)
 *  • 30-day revenue + orders trend chart (Recharts)
 *
 * Data: All from /api/admin/analytics/* (cached 60s server-side)
 */

import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Card, StatCard, Spinner, Badge, Button } from '../components/ui';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  TrendingUp,
  Package,
  AlertTriangle,
  CreditCard,
  ShoppingCart,
  Ticket,
  RefreshCw,
  ArrowUpRight,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface OverviewData {
  revenue: {
    today: number;
    thisMonth: number;
    last30Days: number;
    prevMonth: number;
    growthPct: number;
  };
  orders: {
    today: number;
    thisMonth: number;
    aov: number;
    repeatCustomerRate: number;
    firstTimeCount: number;
    returningCount: number;
  };
  customers: { total: number; newThisMonth: number };
  refunds: { count: number; amount: number; ratePct: number };
}

interface ProductData {
  topByRevenue: Array<{
    productId: string;
    name: string;
    revenue: number;
    quantitySold: number;
    imageUrl: string | null;
  }>;
  topByQuantity: Array<{
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    orderCount: number;
    pctOfTotal: number;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    lowStockThreshold: number;
    price: number;
    imageUrl: string | null;
  }>;
}

interface PaymentData {
  successRate: number;
  failedCount7Days: number;
  totalPayments7Days: number;
  refundRate: number;
  retrySuccessRate: number;
  retryTotal: number;
  retrySuccessful: number;
  byGateway: Array<{ gateway: string; count: number; amount: number }>;
  dailyFailures: Array<{ date: string; failed: number; total: number }>;
}

interface CartData {
  abandonedCarts7Days: number;
  recoveryRate: number;
  recoveredRevenue: number;
  activeCarts: number;
  couponUsageRate: number;
  topCoupons: Array<{
    code: string;
    usageCount: number;
    discountType: string;
    totalDiscount: number;
  }>;
  revenueChart30Days: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

// ============================================
// CHART COLORS
// ============================================

const GOLD = '#d4af37';
const GOLD_LIGHT = '#fef7e0';
const CHART_COLORS = ['#d4af37', '#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

// ============================================
// HELPERS
// ============================================

function formatINR(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ============================================
// LOADING SKELETON
// ============================================

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 animate-pulse">
      <div className="h-4 bg-[#e5e7eb] rounded w-24 mb-4" />
      <div className="h-8 bg-[#e5e7eb] rounded w-32 mb-2" />
      <div className="h-3 bg-[#e5e7eb] rounded w-20" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 animate-pulse">
      <div className="h-5 bg-[#e5e7eb] rounded w-40 mb-6" />
      <div className="h-64 bg-[#f6f7f9] rounded" />
    </div>
  );
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

export default function AnalyticsDashboardPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [products, setProducts] = useState<ProductData | null>(null);
  const [payments, setPayments] = useState<PaymentData | null>(null);
  const [carts, setCarts] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ov, pr, pa, ca] = await Promise.all([
        api.get('/admin/analytics/overview'),
        api.get('/admin/analytics/products'),
        api.get('/admin/analytics/payments'),
        api.get('/admin/analytics/carts'),
      ]);
      setOverview(ov.data.data);
      setProducts(pr.data.data);
      setPayments(pa.data.data);
      setCarts(ca.data.data);
      setLastRefresh(new Date());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to load analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <AdminLayout>
      <div className="max-w-[1440px] mx-auto">
        <PageHeader
          title="Analytics Dashboard"
          description="Business intelligence — revenue, orders, products, payments"
          actions={
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#9ca3af]">
                Updated {lastRefresh.toLocaleTimeString('en-IN')}
              </span>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={fetchAll}
                isLoading={loading}
              >
                Refresh
              </Button>
            </div>
          }
        />

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ──── SECTION 1: SUMMARY CARDS ──── */}
        <section className="mt-6">
          {loading && !overview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : overview ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Revenue Today"
                value={formatINRFull(overview.revenue.today)}
                variant="gold"
                icon={<IndianRupee size={22} />}
              />
              <StatCard
                title="Revenue This Month"
                value={formatINRFull(overview.revenue.thisMonth)}
                variant="primary"
                icon={<TrendingUp size={22} />}
                change={overview.revenue.growthPct !== 0 ? {
                  value: Math.abs(overview.revenue.growthPct),
                  trend: overview.revenue.growthPct >= 0 ? 'up' : 'down',
                } : undefined}
              />
              <StatCard
                title="Orders Today"
                value={overview.orders.today}
                variant="success"
                icon={<ShoppingBag size={22} />}
              />
              <StatCard
                title="Avg Order Value"
                value={formatINRFull(overview.orders.aov)}
                variant="default"
                icon={<BarChart3 size={22} />}
                subtitle={`${overview.orders.thisMonth} orders this month`}
              />
              <StatCard
                title="Repeat Customers"
                value={`${overview.orders.repeatCustomerRate}%`}
                variant="success"
                icon={<Users size={22} />}
                subtitle={`${overview.orders.returningCount} returning / ${overview.orders.firstTimeCount} first-time`}
              />
              <StatCard
                title="Total Customers"
                value={overview.customers.total}
                variant="default"
                icon={<Users size={22} />}
                subtitle={`+${overview.customers.newThisMonth} this month`}
              />
              <StatCard
                title="Refunds This Month"
                value={overview.refunds.count}
                variant={overview.refunds.count > 0 ? 'warning' : 'success'}
                icon={<CreditCard size={22} />}
                subtitle={`${formatINRFull(overview.refunds.amount)} · ${overview.refunds.ratePct}% rate`}
              />
              <StatCard
                title="Revenue (Last 30d)"
                value={formatINR(overview.revenue.last30Days)}
                variant="gold"
                icon={<IndianRupee size={22} />}
              />
            </div>
          ) : null}
        </section>

        {/* ──── SECTION 2: 30-DAY REVENUE & ORDERS CHART ──── */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading && !carts ? (
            <>
              <SkeletonChart />
              <SkeletonChart />
            </>
          ) : carts ? (
            <>
              {/* Revenue Area Chart */}
              <Card>
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Revenue — Last 30 Days</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={carts.revenueChart30Days}>
                      <defs>
                        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={shortDate} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatINR(v)} />
                      <Tooltip
                        formatter={(value: number) => [formatINRFull(value), 'Revenue']}
                        labelFormatter={(label: string) => shortDate(label)}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={GOLD}
                        strokeWidth={2}
                        fill="url(#goldGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Orders Bar Chart */}
              <Card>
                <h3 className="text-lg font-semibold text-[#111827] mb-4">Orders — Last 30 Days</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={carts.revenueChart30Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={shortDate} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(value: number) => [value, 'Orders']}
                        labelFormatter={(label: string) => shortDate(label)}
                        contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                      />
                      <Bar dataKey="orders" fill={GOLD} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          ) : null}
        </section>

        {/* ──── SECTION 3: CATEGORY PIE + PAYMENT HEALTH ──── */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          {products && products.categoryBreakdown.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Revenue by Category</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={products.categoryBreakdown}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ category, pctOfTotal }: { category: string; pctOfTotal: number }) =>
                        `${category} (${pctOfTotal}%)`
                      }
                    >
                      {products.categoryBreakdown.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatINRFull(value)}
                      contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Payment Health */}
          {payments && (
            <Card>
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Payment Health (7 Days)</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-[#f0fdf4] rounded-lg">
                  <p className="text-2xl font-bold text-[#16a34a]">{payments.successRate}%</p>
                  <p className="text-xs text-[#6b7280] mt-1">Success Rate</p>
                </div>
                <div className="text-center p-4 bg-[#fef2f2] rounded-lg">
                  <p className="text-2xl font-bold text-[#dc2626]">{payments.failedCount7Days}</p>
                  <p className="text-xs text-[#6b7280] mt-1">Failed Payments</p>
                </div>
                <div className="text-center p-4 bg-[#fffbeb] rounded-lg">
                  <p className="text-2xl font-bold text-[#b45309]">{payments.refundRate}%</p>
                  <p className="text-xs text-[#6b7280] mt-1">Refund Rate</p>
                </div>
                <div className="text-center p-4 bg-[#eff6ff] rounded-lg">
                  <p className="text-2xl font-bold text-[#2563eb]">
                    {payments.retrySuccessful}/{payments.retryTotal}
                  </p>
                  <p className="text-xs text-[#6b7280] mt-1">Retry Success ({payments.retrySuccessRate}%)</p>
                </div>
              </div>
              {payments.byGateway.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-[#4b5563] mb-2">By Gateway</p>
                  <div className="space-y-2">
                    {payments.byGateway.map(g => (
                      <div key={g.gateway} className="flex items-center justify-between py-1.5 px-3 bg-[#f6f7f9] rounded-lg text-sm">
                        <span className="font-medium text-[#111827]">{g.gateway}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[#6b7280]">{g.count} txns</span>
                          <span className="font-semibold text-[#111827]">{formatINRFull(g.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </section>

        {/* ──── SECTION 4: TOP PRODUCTS TABLE ──── */}
        {products && products.topByRevenue.length > 0 && (
          <section className="mt-8">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#111827]">Top Products by Revenue (30 Days)</h3>
                <Badge variant="info" size="sm">{products.topByRevenue.length} products</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      <th className="text-left py-3 px-3 font-medium text-[#6b7280]">#</th>
                      <th className="text-left py-3 px-3 font-medium text-[#6b7280]">Product</th>
                      <th className="text-right py-3 px-3 font-medium text-[#6b7280]">Revenue</th>
                      <th className="text-right py-3 px-3 font-medium text-[#6b7280]">Qty Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.topByRevenue.map((p, i) => (
                      <tr key={p.productId} className="border-b border-[#f3f4f6] hover:bg-[#f6f7f9] transition-colors">
                        <td className="py-3 px-3 text-[#9ca3af]">{i + 1}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#e5e7eb]" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-[#f6f7f9] flex items-center justify-center">
                                <Package size={16} className="text-[#9ca3af]" />
                              </div>
                            )}
                            <span className="font-medium text-[#111827] truncate max-w-[200px]">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-[#111827]">
                          {formatINRFull(p.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right text-[#4b5563]">{p.quantitySold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}

        {/* ──── SECTION 5: LOW STOCK + ABANDONED CARTS + COUPONS ──── */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Low Stock Alert */}
          {products && products.lowStock.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-[#f59e0b]" />
                <h3 className="text-lg font-semibold text-[#111827]">Low Stock</h3>
                <Badge variant="warning" size="sm">{products.lowStock.length}</Badge>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {products.lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-[#fffbeb] rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-[#fef3c7] flex items-center justify-center">
                          <Package size={12} className="text-[#b45309]" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-[#111827] truncate">{p.name}</span>
                    </div>
                    <Badge
                      variant={p.stockQuantity <= 2 ? 'error' : 'warning'}
                      size="sm"
                    >
                      {p.stockQuantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Abandoned Cart Metrics */}
          {carts && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart size={18} className="text-[#6b7280]" />
                <h3 className="text-lg font-semibold text-[#111827]">Cart Recovery (7 Days)</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
                  <span className="text-sm text-[#6b7280]">Abandoned Carts</span>
                  <span className="text-lg font-bold text-[#111827]">{carts.abandonedCarts7Days}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
                  <span className="text-sm text-[#6b7280]">Recovery Rate</span>
                  <span className="text-lg font-bold text-[#16a34a]">{carts.recoveryRate}%</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
                  <span className="text-sm text-[#6b7280]">Recovered Revenue</span>
                  <span className="text-lg font-bold text-[#111827]">{formatINRFull(carts.recoveredRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f3f4f6]">
                  <span className="text-sm text-[#6b7280]">Active Carts Now</span>
                  <span className="text-lg font-bold text-[#111827]">{carts.activeCarts}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-[#6b7280]">Coupon Usage Rate</span>
                  <span className="text-lg font-bold text-[#111827]">{carts.couponUsageRate}%</span>
                </div>
              </div>
            </Card>
          )}

          {/* Top Coupons */}
          {carts && carts.topCoupons.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Ticket size={18} className="text-[#8b5cf6]" />
                <h3 className="text-lg font-semibold text-[#111827]">Top Coupons</h3>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {carts.topCoupons.map(c => (
                  <div key={c.code} className="flex items-center justify-between py-2 px-3 bg-[#f6f7f9] rounded-lg">
                    <div>
                      <span className="text-sm font-mono font-bold text-[#111827]">{c.code}</span>
                      <p className="text-xs text-[#9ca3af] mt-0.5">{c.discountType} · {c.usageCount} uses</p>
                    </div>
                    <span className="text-sm font-semibold text-[#111827]">
                      {formatINRFull(c.totalDiscount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Bottom padding */}
        <div className="h-12" />
      </div>
    </AdminLayout>
  );
}
