'use client';

/**
 * ORA Admin Panel - Discounts List Page
 * ======================================
 * 
 * Manage discounts, flash sales, and 
 * automatic promotions
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Badge, Input, Select, Card, Spinner, Alert } from '../../components/ui';
import { DataTable, TableActions, TableActionItem, Column } from '../../components/ui/DataTable';
import {
  Plus,
  Search,
  Percent,
  Tag,
  Zap,
  Gift,
  Calendar,
  Copy,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Discount {
  id: string;
  name: string;
  code?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
  value: number;
  appliesTo: 'all' | 'collection' | 'product' | 'customer';
  appliesToName?: string;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'scheduled' | 'expired' | 'disabled';
  createdAt: string;
}

// ============================================
// DISCOUNTS LIST PAGE
// ============================================

export default function DiscountsPage() {
  const router = useRouter();
  
  // State
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch discounts
  useEffect(() => {
    const fetchDiscountsData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/discounts');
        if (!response.ok) throw new Error('Failed to fetch discounts');
        
        const data = await response.json();
        const discountsList = Array.isArray(data) ? data : data.data || [];
        setDiscounts(discountsList);
      } catch (error) {
        console.error('Error fetching discounts:', error);
        setDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscountsData();
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter discounts
  const filteredDiscounts = discounts.filter((discount) => {
    if (statusFilter !== 'all' && discount.status !== statusFilter) return false;
    if (typeFilter !== 'all' && discount.type !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!discount.name.toLowerCase().includes(query) && !discount.code?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Type config
  const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
    percentage: { label: 'Percentage', icon: Percent },
    fixed: { label: 'Fixed Amount', icon: Tag },
    buy_x_get_y: { label: 'Buy X Get Y', icon: Gift },
    free_shipping: { label: 'Free Shipping', icon: Zap },
  };

  // Status config
  const statusConfig: Record<string, { variant: 'success' | 'warning' | 'secondary' | 'error' }> = {
    active: { variant: 'success' },
    scheduled: { variant: 'warning' },
    expired: { variant: 'secondary' },
    disabled: { variant: 'error' },
  };

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // Show success feedback (would integrate with toast system)
    alert(`Copied: ${code}`);
  };

  // Toggle discount status
  const handleToggleStatus = (discount: Discount) => {
    setDiscounts(discounts.map(d => 
      d.id === discount.id 
        ? { ...d, status: d.status === 'disabled' ? 'active' : 'disabled' }
        : d
    ));
  };

  // Table columns
  const columns: Column<any>[] = [
    {
      id: 'discount',
      header: 'Discount',
      accessor: (row) => {
        const TypeIcon = typeConfig[row.type].icon;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-lg flex items-center justify-center flex-shrink-0">
              <TypeIcon size={18} className="text-[var(--admin-primary-600)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--admin-text-primary)]">{row.name}</p>
              {row.code && (
                <div className="flex items-center gap-1">
                  <code className="text-xs bg-[var(--admin-bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--admin-text-muted)]">
                    {row.code}
                  </code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCode(row.code!);
                    }}
                    className="p-0.5 hover:bg-[var(--admin-bg-tertiary)] rounded"
                  >
                    <Copy size={12} className="text-[var(--admin-text-muted)]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      },
      width: '25%',
    },
    {
      id: 'type',
      header: 'Type',
      accessor: (row) => (
        <div>
          <p className="text-sm text-[var(--admin-text-primary)]">
            {row.type === 'percentage' && `${row.value}% off`}
            {row.type === 'fixed' && `${formatCurrency(row.value)} off`}
            {row.type === 'free_shipping' && 'Free Shipping'}
            {row.type === 'buy_x_get_y' && 'Buy X Get Y'}
          </p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            {row.appliesTo === 'all' && 'All products'}
            {row.appliesTo === 'collection' && row.appliesToName}
            {row.appliesTo === 'product' && row.appliesToName}
            {row.appliesTo === 'customer' && row.appliesToName}
          </p>
        </div>
      ),
      width: '18%',
    },
    {
      id: 'usage',
      header: 'Usage',
      accessor: (row) => (
        <div>
          <p className="text-sm font-medium text-[var(--admin-text-primary)]">
            {row.usedCount} {row.maxUses ? `/ ${row.maxUses}` : ''}
          </p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            {row.maxUses ? `${Math.round((row.usedCount / row.maxUses) * 100)}% used` : 'Unlimited'}
          </p>
        </div>
      ),
      width: '12%',
    },
    {
      id: 'dates',
      header: 'Duration',
      accessor: (row) => (
        <div className="text-sm">
          <p className="text-[var(--admin-text-primary)]">{formatDate(row.startDate)}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            {row.endDate ? `to ${formatDate(row.endDate)}` : 'No end date'}
          </p>
        </div>
      ),
      width: '15%',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant={statusConfig[row.status]?.variant} size="sm">
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
      width: '10%',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Discounts"
          description="Create and manage product discounts and sales"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Marketing', href: '/admin/v2/marketing' },
            { label: 'Discounts' },
          ]}
          actions={
            <Button
              leftIcon={<Plus size={18} />}
              onClick={() => router.push('/admin/v2/marketing/discounts/new')}
            >
              Create Discount
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--admin-success-100)] rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-[var(--admin-success-600)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--admin-text-muted)]">Active</p>
                <p className="text-xl font-bold text-[var(--admin-text-primary)]">
                  {discounts.filter(d => d.status === 'active').length}
                </p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--admin-warning-100)] rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-[var(--admin-warning-600)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--admin-text-muted)]">Scheduled</p>
                <p className="text-xl font-bold text-[var(--admin-text-primary)]">
                  {discounts.filter(d => d.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                <Tag size={20} className="text-[var(--admin-primary-600)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--admin-text-muted)]">Total Uses</p>
                <p className="text-xl font-bold text-[var(--admin-text-primary)]">
                  {discounts.reduce((sum, d) => sum + d.usedCount, 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--admin-gold-100)] rounded-xl flex items-center justify-center">
                <Percent size={20} className="text-[var(--admin-gold-600)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--admin-text-muted)]">Avg Discount</p>
                <p className="text-xl font-bold text-[var(--admin-text-primary)]">
                  {Math.round(discounts.filter(d => d.type === 'percentage').reduce((sum, d) => sum + d.value, 0) / discounts.filter(d => d.type === 'percentage').length || 0)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search discounts or codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'expired', label: 'Expired' },
                { value: 'disabled', label: 'Disabled' },
              ]}
            />
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'fixed', label: 'Fixed Amount' },
                { value: 'free_shipping', label: 'Free Shipping' },
                { value: 'buy_x_get_y', label: 'Buy X Get Y' },
              ]}
            />
          </div>
        </Card>

        {/* Discounts Table */}
        <DataTable
          data={filteredDiscounts}
          columns={columns}
          loading={loading}
          selectable
          selectedRows={selectedDiscounts}
          onSelectionChange={setSelectedDiscounts}
          getRowId={(row: any) => row.id as string}
          onRowClick={(row: any) => router.push(`/admin/v2/marketing/discounts/${row.id as string}`)}
          bulkActions={[
            { label: 'Activate', onClick: () => {} },
            { label: 'Disable', onClick: () => {} },
            { label: 'Delete', onClick: () => {}, variant: 'danger' },
          ]}
          rowActions={(row: any) => (
            <TableActions>
              <TableActionItem
                icon={<Edit size={16} />}
                onClick={() => router.push(`/admin/v2/marketing/discounts/${row.id as string}`)}
              >
                Edit
              </TableActionItem>
              {row.code && (
                <TableActionItem
                  icon={<Copy size={16} />}
                  onClick={() => handleCopyCode(row.code as string)}
                >
                  Copy Code
                </TableActionItem>
              )}
              <TableActionItem
                icon={row.status === 'disabled' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                onClick={() => handleToggleStatus(row)}
              >
                {row.status === 'disabled' ? 'Enable' : 'Disable'}
              </TableActionItem>
              <TableActionItem
                icon={<Trash2 size={16} />}
                onClick={() => {}}
                variant="danger"
              >
                Delete
              </TableActionItem>
            </TableActions>
          )}
          emptyState={
            <div className="text-center py-12">
              <Percent size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
              <h3 className="text-lg font-semibold text-[var(--admin-text-primary)] mb-2">No discounts found</h3>
              <p className="text-sm text-[var(--admin-text-muted)] mb-4">
                Create your first discount to boost sales
              </p>
              <Button onClick={() => router.push('/admin/v2/marketing/discounts/new')}>
                Create Discount
              </Button>
            </div>
          }
        />
      </div>
    </AdminLayout>
  );
}
