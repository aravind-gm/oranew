'use client';

/**
 * ORA Admin Panel - Marketing Dashboard
 * =====================================
 * 
 * Marketing hub with discounts, campaigns,
 * email marketing, and abandoned cart recovery
 */

import React from 'react';
import Link from 'next/link';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Card, Badge, StatCard } from '../components/ui';
import {
  Tag,
  Percent,
  Gift,
  Mail,
  ShoppingCart,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Megaphone,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  IndianRupee,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Campaign {
  id: string;
  name: string;
  type: 'discount' | 'coupon' | 'flash_sale' | 'bundle';
  status: 'active' | 'scheduled' | 'ended' | 'draft';
  startDate: string;
  endDate: string;
  redemptions: number;
  revenue: number;
}

interface EmailCampaign {
  id: string;
  name: string;
  status: 'sent' | 'scheduled' | 'draft';
  sentTo: number;
  opened: number;
  clicked: number;
  scheduledFor?: string;
}

interface AbandonedCart {
  id: string;
  customerName: string;
  email: string;
  cartValue: number;
  items: number;
  abandonedAt: string;
  remindersSent: number;
  recovered: boolean;
}

// ============================================
// MARKETING DASHBOARD
// ============================================

export default function MarketingPage() {
  // Static stats for the marketing overview hub
  const stats = {
    activeDiscounts: 5,
    totalCouponsUsed: 234,
    abandonedCarts: 18,
    recoveryRate: 23,
    emailsSent: 1250,
    conversionRate: 4.2,
  };

  const activeCampaigns: Campaign[] = [
    {
      id: '1',
      name: 'Summer Sale 2024',
      type: 'discount',
      status: 'active',
      startDate: '2024-06-01',
      endDate: '2024-06-30',
      redemptions: 156,
      revenue: 450000,
    },
    {
      id: '2',
      name: 'First Order 10% Off',
      type: 'coupon',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      redemptions: 89,
      revenue: 178000,
    },
    {
      id: '3',
      name: 'Flash Sale - Gold',
      type: 'flash_sale',
      status: 'scheduled',
      startDate: '2024-06-15',
      endDate: '2024-06-16',
      redemptions: 0,
      revenue: 0,
    },
  ];

  const recentEmailCampaigns: EmailCampaign[] = [
    {
      id: '1',
      name: 'Summer Collection Launch',
      status: 'sent',
      sentTo: 2500,
      opened: 875,
      clicked: 156,
    },
    {
      id: '2',
      name: 'Father\'s Day Gift Guide',
      status: 'scheduled',
      sentTo: 0,
      opened: 0,
      clicked: 0,
      scheduledFor: '2024-06-14T10:00:00',
    },
  ];

  const abandonedCarts: AbandonedCart[] = [
    {
      id: '1',
      customerName: 'Meera Reddy',
      email: 'meera@example.com',
      cartValue: 35000,
      items: 2,
      abandonedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      remindersSent: 0,
      recovered: false,
    },
    {
      id: '2',
      customerName: 'Anjali Kapoor',
      email: 'anjali@example.com',
      cartValue: 52000,
      items: 3,
      abandonedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      remindersSent: 1,
      recovered: false,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const campaignTypeConfig = {
    discount: { icon: Percent, color: 'primary' },
    coupon: { icon: Tag, color: 'success' },
    flash_sale: { icon: Zap, color: 'warning' },
    bundle: { icon: Gift, color: 'gold' },
  };

  const campaignStatusConfig: Record<string, { variant: 'success' | 'warning' | 'secondary' | 'error' }> = {
    active: { variant: 'success' },
    scheduled: { variant: 'warning' },
    ended: { variant: 'secondary' },
    draft: { variant: 'secondary' },
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Marketing"
          description="Manage discounts, campaigns, and customer engagement"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Marketing' },
          ]}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Discounts"
            value={stats.activeDiscounts.toString()}
            icon={<Percent size={24} />}
            trend={{ value: 2, direction: 'up' }}
          />
          <StatCard
            title="Coupons Used"
            value={stats.totalCouponsUsed.toString()}
            icon={<Tag size={24} />}
            trend={{ value: 12, direction: 'up' }}
            subtitle="This month"
          />
          <StatCard
            title="Abandoned Carts"
            value={stats.abandonedCarts.toString()}
            icon={<ShoppingCart size={24} />}
            subtitle="Pending recovery"
          />
          <StatCard
            title="Cart Recovery Rate"
            value={`${stats.recoveryRate}%`}
            icon={<TrendingUp size={24} />}
            trend={{ value: 5, direction: 'up' }}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/v2/marketing/discounts/new">
            <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                  <Percent size={20} className="text-[var(--admin-primary-600)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--admin-text-primary)]">Create Discount</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">Product or category</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin/v2/marketing/coupons/new">
            <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--admin-success-100)] rounded-xl flex items-center justify-center">
                  <Tag size={20} className="text-[var(--admin-success-600)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--admin-text-primary)]">Create Coupon</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">Code-based discount</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin/v2/marketing/email/new">
            <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--admin-gold-100)] rounded-xl flex items-center justify-center">
                  <Mail size={20} className="text-[var(--admin-gold-600)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--admin-text-primary)]">Email Campaign</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">Send to customers</p>
                </div>
              </div>
            </Card>
          </Link>
          <Link href="/admin/v2/marketing/abandoned-carts">
            <Card className="hover:border-[var(--admin-primary-300)] cursor-pointer transition-colors h-full" padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--admin-warning-100)] rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} className="text-[var(--admin-warning-600)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--admin-text-primary)]">Recover Carts</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{stats.abandonedCarts} pending</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Campaigns */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Active Campaigns</h3>
              <Link
                href="/admin/v2/marketing/discounts"
                className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)]"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {activeCampaigns.map((campaign) => {
                const typeConfig = campaignTypeConfig[campaign.type];
                const TypeIcon = typeConfig.icon;
                
                return (
                  <Link
                    key={campaign.id}
                    href={`/admin/v2/marketing/discounts/${campaign.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--admin-bg-secondary)] -mx-3 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: `var(--admin-${typeConfig.color}-100)`,
                      }}
                    >
                      <TypeIcon
                        size={20}
                        style={{
                          color: `var(--admin-${typeConfig.color}-600)`,
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--admin-text-primary)] truncate">{campaign.name}</p>
                        <Badge variant={campaignStatusConfig[campaign.status]?.variant} size="sm">
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        {campaign.redemptions} redemptions · {formatCurrency(campaign.revenue)} revenue
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-[var(--admin-text-muted)]" />
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Recent Email Campaigns */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Email Campaigns</h3>
              <Link
                href="/admin/v2/marketing/email"
                className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)]"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {recentEmailCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/admin/v2/marketing/email/${campaign.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[var(--admin-bg-secondary)] -mx-3 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--admin-gold-100)]">
                    <Mail size={20} className="text-[var(--admin-gold-600)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--admin-text-primary)] truncate">{campaign.name}</p>
                      <Badge
                        variant={campaign.status === 'sent' ? 'success' : campaign.status === 'scheduled' ? 'warning' : 'secondary'}
                        size="sm"
                      >
                        {campaign.status}
                      </Badge>
                    </div>
                    {campaign.status === 'sent' ? (
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        {campaign.sentTo} sent · {Math.round((campaign.opened / campaign.sentTo) * 100)}% opened · {Math.round((campaign.clicked / campaign.sentTo) * 100)}% clicked
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        Scheduled for {campaign.scheduledFor && new Date(campaign.scheduledFor).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={16} className="text-[var(--admin-text-muted)]" />
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Abandoned Carts Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[var(--admin-text-primary)]">Abandoned Cart Recovery</h3>
              <Badge variant="warning">{abandonedCarts.length} pending</Badge>
            </div>
            <Link
              href="/admin/v2/marketing/abandoned-carts"
              className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)]"
            >
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Cart Value</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Abandoned</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-[var(--admin-text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {abandonedCarts.map((cart) => (
                  <tr key={cart.id} className="hover:bg-[var(--admin-bg-secondary)]">
                    <td className="py-3 px-4">
                      <p className="font-medium text-[var(--admin-text-primary)]">{cart.customerName}</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{cart.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[var(--admin-text-primary)]">{formatCurrency(cart.cartValue)}</p>
                      <p className="text-xs text-[var(--admin-text-muted)]">{cart.items} items</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-[var(--admin-text-muted)]">
                        <Clock size={14} />
                        {formatTimeAgo(cart.abandonedAt)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cart.remindersSent === 0 ? (
                        <Badge variant="warning" size="sm">No reminder sent</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">{cart.remindersSent} reminder{cart.remindersSent > 1 ? 's' : ''} sent</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm" leftIcon={<Mail size={14} />}>
                          Send Reminder
                        </Button>
                        <Button variant="ghost" size="sm">
                          View Cart
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Marketing Tips */}
        <Card className="bg-gradient-to-r from-[var(--admin-primary-50)] to-[var(--admin-gold-50)] border-[var(--admin-primary-200)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Megaphone size={24} className="text-[var(--admin-primary-600)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-1">Marketing Tips</h3>
              <p className="text-sm text-[var(--admin-text-muted)] mb-3">
                Boost your sales with these quick actions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm text-[var(--admin-text-primary)]">
                  <CheckCircle size={16} className="text-[var(--admin-success-500)]" />
                  Send abandoned cart reminders within 1 hour
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--admin-text-primary)]">
                  <CheckCircle size={16} className="text-[var(--admin-success-500)]" />
                  Create flash sales during weekends
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--admin-text-primary)]">
                  <CheckCircle size={16} className="text-[var(--admin-success-500)]" />
                  Offer first-purchase discounts to new visitors
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
