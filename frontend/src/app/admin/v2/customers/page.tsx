'use client';

/**
 * ORA Admin Panel - Customers List Page
 * ======================================
 * 
 * Customer management with order history,
 * segments, and customer tags
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Badge, Input, Select, Card, Spinner } from '../components/ui';
import { DataTable, TableActions, TableActionItem, Column } from '../components/ui/DataTable';
import {
  Search,
  Download,
  Upload,
  Eye,
  Mail,
  Crown,
  Users,
  User,
  ShoppingBag,
  Heart,
  Calendar,
  Phone,
  MapPin,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender?: string;
  isVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  lastOrderDate?: string;
  createdAt: string;
}

// ============================================
// CUSTOMER TAGS
// ============================================

const CustomerTags = ({ tags }: { tags: string[] }) => {
  if (tags.length === 0) return null;

  const tagConfig: Record<string, { variant: 'gold' | 'primary' | 'secondary' | 'success' }> = {
    VIP: { variant: 'gold' },
    'Repeat Buyer': { variant: 'success' },
    'New Customer': { variant: 'primary' },
    'High Value': { variant: 'gold' },
  };

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag, index) => (
        <Badge key={index} variant={tagConfig[tag]?.variant || 'secondary'} size="sm">
          {tag === 'VIP' && <Crown size={10} className="mr-1" />}
          {tag}
        </Badge>
      ))}
    </div>
  );
};

// ============================================
// CUSTOMERS PAGE
// ============================================

export default function CustomersPage() {
  const router = useRouter();
  
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fetch customers
  useEffect(() => {
    const fetchCustomersData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/customers');
        if (!response.ok) throw new Error('Failed to fetch customers');
        
        const data = await response.json();
        
        // Transform API response to Customer format
        const transformedCustomers = (data.data || data || []).map((customer: any) => ({
          id: customer.id,
          fullName: customer.fullName || customer.name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          gender: customer.gender || '',
          isVerified: customer.isVerified || false,
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0,
          tags: customer.tags || [],
          lastOrderDate: customer.lastOrderDate,
          createdAt: customer.createdAt,
        }));
        
        setCustomers(transformedCustomers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        // Fallback to empty state if API fails
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersData();
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

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !customer.fullName.toLowerCase().includes(query) &&
        !customer.email.toLowerCase().includes(query) &&
        !customer.phone.includes(query)
      ) {
        return false;
      }
    }

    if (tagFilter !== 'all' && !customer.tags.includes(tagFilter)) {
      return false;
    }

    return true;
  });

  // Paginated customers
  const paginatedCustomers = filteredCustomers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Stats
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter(c => c.tags.includes('VIP')).length;
  const repeatBuyers = customers.filter(c => c.tags.includes('Repeat Buyer')).length;

  // Table columns
  const columns: Column<any>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--admin-primary-100)] flex items-center justify-center flex-shrink-0">
            <span className="font-semibold text-[var(--admin-primary-600)]">
              {row.fullName.charAt(0)}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-[var(--admin-text-primary)]">{row.fullName}</p>
              {row.tags.includes('VIP') && (
                <Crown size={14} className="text-[var(--admin-gold-500)]" />
              )}
            </div>
            <p className="text-xs text-[var(--admin-text-muted)]">{row.email}</p>
          </div>
        </div>
      ),
      width: '25%',
    },
    {
      id: 'contact',
      header: 'Contact',
      accessor: (row) => (
        <div className="text-sm">
          <p className="text-[var(--admin-text-primary)]">{row.phone}</p>
          <p className="text-xs text-[var(--admin-text-muted)]">{row.gender || 'Not specified'}</p>
        </div>
      ),
      width: '15%',
    },
    {
      id: 'orders',
      header: 'Orders',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-[var(--admin-text-muted)]" />
          <span className="font-medium text-[var(--admin-text-primary)]">{row.totalOrders}</span>
        </div>
      ),
      width: '10%',
    },
    {
      id: 'spent',
      header: 'Total Spent',
      accessor: (row) => (
        <span className="font-medium text-[var(--admin-text-primary)]">
          {formatCurrency(row.totalSpent)}
        </span>
      ),
      width: '12%',
    },
    {
      id: 'tags',
      header: 'Tags',
      accessor: (row) => <CustomerTags tags={row.tags} />,
      width: '18%',
    },
    {
      id: 'lastOrder',
      header: 'Last Order',
      accessor: (row) => (
        <span className="text-sm text-[var(--admin-text-muted)]">
          {row.lastOrderDate ? formatDate(row.lastOrderDate) : 'Never'}
        </span>
      ),
      width: '12%',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Customers"
          description="Manage your customer relationships"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Customers' },
          ]}
          actions={
            <>
              <Button variant="secondary" leftIcon={<Download size={18} />}>
                Export
              </Button>
            </>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card padding="sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--admin-primary-100)] rounded-xl flex items-center justify-center">
                <Users size={24} className="text-[var(--admin-primary-600)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Total Customers</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">{totalCustomers}</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--admin-gold-100)] rounded-xl flex items-center justify-center">
                <Crown size={24} className="text-[var(--admin-gold-600)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">VIP Customers</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">{vipCustomers}</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--admin-success-100)] rounded-xl flex items-center justify-center">
                <Heart size={24} className="text-[var(--admin-success-600)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Repeat Buyers</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">{repeatBuyers}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            <Select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Tags' },
                { value: 'VIP', label: 'VIP' },
                { value: 'Repeat Buyer', label: 'Repeat Buyer' },
                { value: 'New Customer', label: 'New Customer' },
                { value: 'High Value', label: 'High Value' },
              ]}
            />
          </div>
        </Card>

        {/* Customers Table */}
        <DataTable
          data={paginatedCustomers}
          columns={columns}
          loading={loading}
          selectable
          selectedRows={selectedCustomers}
          onSelectionChange={setSelectedCustomers}
          getRowId={(row) => row.id}
          onRowClick={(row) => router.push(`/admin/v2/customers/${row.id}`)}
          bulkActions={[
            { label: 'Send Email', onClick: () => {} },
            { label: 'Add Tag', onClick: () => {} },
          ]}
          rowActions={(row) => (
            <TableActions>
              <TableActionItem
                icon={<Eye size={16} />}
                onClick={() => router.push(`/admin/v2/customers/${row.id}`)}
              >
                View Profile
              </TableActionItem>
              <TableActionItem
                icon={<ShoppingBag size={16} />}
                onClick={() => router.push(`/admin/v2/orders?customer=${row.id}`)}
              >
                View Orders
              </TableActionItem>
              <TableActionItem
                icon={<Mail size={16} />}
                onClick={() => {}}
              >
                Send Email
              </TableActionItem>
              <TableActionItem
                icon={<Crown size={16} />}
                onClick={() => {}}
              >
                {row.tags.includes('VIP') ? 'Remove VIP' : 'Mark as VIP'}
              </TableActionItem>
            </TableActions>
          )}
          pagination={{
            page,
            pageSize,
            total: filteredCustomers.length,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
          }}
          emptyState={
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-[var(--admin-text-muted)] mb-4" />
              <h3 className="text-lg font-semibold text-[var(--admin-text-primary)] mb-2">No customers found</h3>
              <p className="text-sm text-[var(--admin-text-muted)]">
                Customers will appear here when they sign up or place orders
              </p>
            </div>
          }
        />
      </div>
    </AdminLayout>
  );
}
