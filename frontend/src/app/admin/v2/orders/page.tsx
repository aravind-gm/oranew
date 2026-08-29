'use client';

/**
 * ORA Admin Panel - Orders List Page
 * ===================================
 * 
 * Complete order lifecycle management
 * Filters, status updates, bulk actions
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Badge, Input, Select, Card, Spinner } from '../components/ui';
import { DataTable, TableActions, TableActionItem, Column } from '../components/ui/DataTable';
import {
  Search,
  Download,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  FileText,
  ShoppingCart,
  Package,
  Trash2,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

// ============================================
// TYPES
// ============================================

interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'VERIFIED' | 'CONFIRMED' | 'FAILED' | 'REFUNDED';
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    city: string;
    state: string;
  };
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

// ============================================
// ORDER STATUS BADGE
// ============================================

const OrderStatusBadge = ({ status }: { status: Order['status'] }) => {
  const config: Record<Order['status'], { variant: 'success' | 'warning' | 'error' | 'info' | 'secondary' | 'primary'; label: string }> = {
    PENDING: { variant: 'warning', label: 'Pending' },
    CONFIRMED: { variant: 'info', label: 'Confirmed' },
    PROCESSING: { variant: 'info', label: 'Processing' },
    SHIPPED: { variant: 'primary', label: 'Shipped' },
    DELIVERED: { variant: 'success', label: 'Delivered' },
    CANCELLED: { variant: 'error', label: 'Cancelled' },
    RETURNED: { variant: 'secondary', label: 'Returned' },
    REFUNDED: { variant: 'secondary', label: 'Refunded' },
  };

  const { variant, label } = config[status];
  return <Badge variant={variant} dot>{label}</Badge>;
};

// ============================================
// PAYMENT STATUS BADGE
// ============================================

const PaymentStatusBadge = ({ status, method }: { status: Order['paymentStatus']; method?: string }) => {
  const isCOD = method?.toUpperCase() === 'COD';

  if (isCOD) {
    if (status === 'CONFIRMED') {
      return <Badge variant="success">Paid (COD)</Badge>;
    }
    return <Badge variant="warning">COD (Pending)</Badge>;
  }

  const config: Record<Order['paymentStatus'], { variant: 'success' | 'warning' | 'error' | 'info' | 'secondary'; label: string }> = {
    PENDING: { variant: 'warning', label: 'Pending' },
    VERIFIED: { variant: 'info', label: 'Verified' },
    CONFIRMED: { variant: 'success', label: 'Paid' },
    FAILED: { variant: 'error', label: 'Failed' },
    REFUNDED: { variant: 'secondary', label: 'Refunded' },
  };

  const item = config[status] || { variant: 'secondary', label: status };
  return <Badge variant={item.variant}>{item.label}</Badge>;
};

// ============================================
// STATUS TABS
// ============================================

interface StatusTabsProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  counts: Record<string, number>;
}

const StatusTabs = ({ activeStatus, onStatusChange, counts }: StatusTabsProps) => {
  const tabs = [
    { id: 'all', label: 'All Orders', icon: ShoppingCart },
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'processing', label: 'Processing', icon: RefreshCw },
    { id: 'shipped', label: 'Shipped', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle },
  ];

  return (
    <div className="flex gap-1 p-1 bg-[#f6f7f9] rounded-xl overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeStatus === tab.id;
        const count = counts[tab.id] || 0;

        return (
          <button
            key={tab.id}
            onClick={() => onStatusChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${isActive 
                ? 'bg-white text-[#111827] shadow-sm' 
                : 'text-[#4b5563] hover:text-[#111827]'
              }
            `}
          >
            <Icon size={16} />
            {tab.label}
            {count > 0 && (
              <span className={`
                px-1.5 py-0.5 text-xs rounded-full
                ${isActive 
                  ? 'bg-[#fde8b3] text-[#b8962e]' 
                  : 'bg-[#e5e7eb] text-[#9ca3af]'
                }
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// ORDERS PAGE
// ============================================

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { orders, ordersLoading, ordersPagination, fetchOrders, updateOrderStatus, deleteOrder } = useAdminStore();
  
  // State
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [page, setPage] = useState(1);
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTargetOrder) return;
    setDeleting(true);
    const success = await deleteOrder(deleteTargetOrder.id);
    setDeleting(false);
    if (success) {
      setDeleteTargetOrder(null);
      fetchOrders(page, statusFilter !== 'all' ? statusFilter : undefined);
    }
  };

  // Fetch orders with server-side status filter
  useEffect(() => {
    fetchOrders(page, statusFilter !== 'all' ? statusFilter : undefined);
  }, [fetchOrders, page, statusFilter]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Client-side search filtering (search is local against fetched page)
  const displayOrders = (orders || []).filter((order: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber?.toLowerCase().includes(query) ||
      order.user?.fullName?.toLowerCase().includes(query) ||
      order.user?.email?.toLowerCase().includes(query)
    );
  });

  // Status counts from current data (approximate from server response)
  const statusCounts: Record<string, number> = {
    all: ordersPagination.total || orders?.length || 0,
  };

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      fetchOrders(page, statusFilter !== 'all' ? statusFilter : undefined);
    }
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    const rows = displayOrders;
    if (rows.length === 0) return;
    const header = 'Order #,Customer,Email,Status,Payment,Total,Date\n';
    const csvRows = rows.map((o: any) =>
      `"${o.orderNumber}","${o.user?.fullName || 'Guest'}","${o.user?.email || ''}","${o.status}","${o.paymentStatus}",${o.totalAmount},"${o.createdAt}"`
    ).join('\n');
    const blob = new Blob([header + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ora-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table columns
  const columns: Column<any>[] = [
    {
      id: 'order',
      header: 'Order',
      accessor: (row) => (
        <div>
          <Link 
            href={`/admin/v2/orders/${row.id}`}
            className="font-medium text-[#d4af37] hover:underline"
          >
            #{row.orderNumber}
          </Link>
          <p className="text-xs text-[#9ca3af] mt-1">
            {formatDate(row.createdAt)}
          </p>
        </div>
      ),
      width: '15%',
    },
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <p className="font-medium text-[#111827]">{row.user?.fullName || 'Guest'}</p>
          <p className="text-xs text-[#9ca3af]">{row.user?.email}</p>
        </div>
      ),
      width: '20%',
    },
    {
      id: 'items',
      header: 'Items',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#f6f7f9] rounded-lg flex items-center justify-center">
            <Package size={18} className="text-[#9ca3af]" />
          </div>
          <div>
            <p className="text-sm text-[#111827]">
              {row.items?.length || 0} item{(row.items?.length || 0) !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-[#9ca3af] truncate max-w-[150px]">
              {row.items?.[0]?.productName || 'No items'}
              {row.items?.length > 1 && ` +${row.items.length - 1} more`}
            </p>
          </div>
        </div>
      ),
      width: '20%',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => <OrderStatusBadge status={row.status} />,
      width: '12%',
    },
    {
      id: 'payment',
      header: 'Payment',
      accessor: (row) => <PaymentStatusBadge status={row.paymentStatus} method={row.paymentMethod} />,
      width: '12%',
    },
    {
      id: 'total',
      header: 'Total',
      align: 'right',
      accessor: (row) => (
        <span className="font-medium text-[#111827]">
          {formatCurrency(row.totalAmount)}
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
          title="Orders"
          description="Manage and track customer orders"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Orders' },
          ]}
          actions={
            <>
              <Button variant="secondary" leftIcon={<Download size={18} />} onClick={handleExportCSV}>
                Export
              </Button>
            </>
          }
        />

        {/* Status Tabs */}
        <StatusTabs
          activeStatus={statusFilter}
          onStatusChange={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
          counts={statusCounts}
        />

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by order #, customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <DataTable
          data={displayOrders}
          columns={columns}
          loading={ordersLoading}
          selectable
          selectedRows={selectedOrders}
          onSelectionChange={setSelectedOrders}
          getRowId={(row: any) => row.id as string}
          onRowClick={(row: any) => router.push(`/admin/v2/orders/${row.id as string}`)}
          bulkActions={[
            { 
              label: 'Mark as Processing', 
              onClick: async (ids) => {
                for (const id of ids) {
                  await handleStatusUpdate(id, 'PROCESSING');
                }
                setSelectedOrders([]);
                fetchOrders(page, statusFilter !== 'all' ? statusFilter : undefined);
              }
            },
            { 
              label: 'Mark as Shipped', 
              onClick: async (ids) => {
                for (const id of ids) {
                  await handleStatusUpdate(id, 'SHIPPED');
                }
                setSelectedOrders([]);
                fetchOrders(page, statusFilter !== 'all' ? statusFilter : undefined);
              }
            },
          ]}
          rowActions={(row: any) => (
            <TableActions>
              <TableActionItem
                icon={<Eye size={16} />}
                onClick={() => router.push(`/admin/v2/orders/${row.id}`)}
              >
                View Details
              </TableActionItem>
              <TableActionItem
                icon={<FileText size={16} />}
                onClick={() => router.push(`/admin/v2/orders/${row.id}`)}
              >
                View Invoice
              </TableActionItem>
              <TableActionItem
                icon={<Mail size={16} />}
                onClick={() => {
                  const email = row.user?.email;
                  if (email) window.open(`mailto:${email}?subject=Order%20%23${row.orderNumber}`);
                }}
              >
                Email Customer
              </TableActionItem>
              {row.status === 'PENDING' && (
                <TableActionItem
                  icon={<CheckCircle size={16} />}
                  onClick={() => handleStatusUpdate(row.id as string, 'CONFIRMED')}
                >
                  Confirm Order
                </TableActionItem>
              )}
              {(row.status === 'CONFIRMED' || row.status === 'PROCESSING') && (
                <TableActionItem
                  icon={<Truck size={16} />}
                  onClick={() => handleStatusUpdate(row.id as string, 'SHIPPED')}
                >
                  Mark as Shipped
                </TableActionItem>
              )}
              {row.status === 'SHIPPED' && (
                <TableActionItem
                  icon={<Package size={16} />}
                  onClick={() => handleStatusUpdate(row.id as string, 'DELIVERED')}
                >
                  Mark as Delivered
                </TableActionItem>
              )}
              {row.status !== 'CANCELLED' && row.status !== 'DELIVERED' && (
                <TableActionItem
                  icon={<XCircle size={16} />}
                  onClick={() => handleStatusUpdate(row.id as string, 'CANCELLED')}
                  variant="danger"
                >
                  Cancel Order
                </TableActionItem>
              )}
              <TableActionItem
                icon={<Trash2 size={16} />}
                onClick={() => setDeleteTargetOrder({ id: row.id as string, orderNumber: row.orderNumber as string })}
                variant="danger"
              >
                Delete Order
              </TableActionItem>
            </TableActions>
          )}
          pagination={{
            page,
            pageSize: 20,
            total: ordersPagination.total,
            onPageChange: setPage,
            onPageSizeChange: () => {},
          }}
          emptyState={
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-[#9ca3af] mb-4" />
              <h3 className="text-lg font-semibold text-[#111827] mb-2">No orders found</h3>
              <p className="text-sm text-[#9ca3af]">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Orders will appear here when customers place them'
                }
              </p>
            </div>
          }
        />

        {/* Delete Order Confirmation Modal */}
        {deleteTargetOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-red-200">
              <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <Trash2 className="text-red-600" size={22} />
                Delete Order #{deleteTargetOrder.orderNumber}?
              </h3>
              <p className="text-sm text-[var(--admin-text-secondary)]">
                This action is permanent and cannot be undone. The order and its associated records will be deleted.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeleteTargetOrder(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={deleting}
                  onClick={handleConfirmDelete}
                >
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
