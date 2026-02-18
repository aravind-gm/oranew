'use client';

/**
 * ORA Admin Panel - Products List Page
 * =====================================
 * 
 * Full product management with Shopify-level controls
 * Filters, bulk actions, status management, archive/restore
 */

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Badge, Input, Select, Card, Alert } from '../components/ui';
import { DataTable, TableActions, TableActionItem, Column } from '../components/ui/DataTable';
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  Package,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import api from '@/lib/api';

// ============================================
// TYPES
// ============================================

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  finalPrice: number;
  discountPercent: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  deletedAt: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  images: {
    id: string;
    imageUrl: string;
    isPrimary: boolean;
  }[];
  createdAt: string;
}

// ============================================
// PRODUCT STATUS BADGE
// ============================================

const ProductStatusBadge = ({ isActive, stock, deletedAt }: { isActive: boolean; stock: number; deletedAt?: string | null }) => {
  if (deletedAt) {
    return <Badge variant="secondary">Archived</Badge>;
  }
  if (!isActive) {
    return <Badge variant="secondary">Draft</Badge>;
  }
  if (stock === 0) {
    return <Badge variant="error">Out of Stock</Badge>;
  }
  if (stock <= 5) {
    return <Badge variant="warning">Low Stock</Badge>;
  }
  return <Badge variant="success">Active</Badge>;
};

// ============================================
// PRODUCTS PAGE
// ============================================

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { products, productsLoading, productsPagination, fetchProducts } = useAdminStore();
  
  // State
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Build server-side query params
  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (statusFilter === 'archived') params.archived = 'true';
    else if (statusFilter === 'active') params.isActive = 'true';
    else if (statusFilter === 'draft') params.isActive = 'false';
    else if (statusFilter === 'outOfStock') params.outOfStock = 'true';
    else if (statusFilter === 'lowStock') params.lowStock = 'true';
    return params;
  }, [searchQuery, categoryFilter, statusFilter]);

  // Fetch products with server-side params
  useEffect(() => {
    fetchProducts(page, buildParams());
  }, [fetchProducts, page, buildParams]);

  // Load categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get('/categories');
        const cats = response.data.data || response.data || [];
        setCategories(Array.isArray(cats) ? cats : []);
      } catch {
        // Categories are optional, silently fail
      }
    };
    loadCategories();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  // Auto-dismiss messages
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // ============================================
  // PRODUCT ACTIONS
  // ============================================

  const handleArchive = async (productId: string) => {
    if (!confirm('Archive this product? It will be hidden from the storefront.')) return;
    setActionLoading(true);
    try {
      await api.put(`/admin/products/${productId}/archive`);
      setActionMessage({ type: 'success', text: 'Product archived successfully' });
      fetchProducts(page, buildParams());
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to archive product' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (productId: string) => {
    setActionLoading(true);
    try {
      await api.put(`/admin/products/${productId}/restore`);
      setActionMessage({ type: 'success', text: 'Product restored as draft' });
      fetchProducts(page, buildParams());
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to restore product' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product? This performs a soft delete (archive).')) return;
    await handleArchive(productId);
  };

  const handleBulkAction = async (action: string, ids: string[]) => {
    if (ids.length === 0) return;
    const actionLabel = { activate: 'activate', deactivate: 'deactivate', archive: 'archive', restore: 'restore' }[action] || action;
    if (!confirm(`${actionLabel.charAt(0).toUpperCase() + actionLabel.slice(1)} ${ids.length} product(s)?`)) return;
    
    setActionLoading(true);
    try {
      await api.post('/admin/products/bulk-action', { action, productIds: ids });
      setActionMessage({ type: 'success', text: `${ids.length} product(s) ${actionLabel}d successfully` });
      setSelectedProducts([]);
      fetchProducts(page, buildParams());
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || `Failed to ${actionLabel} products` });
    } finally {
      setActionLoading(false);
    }
  };

  // Export products to CSV
  const handleExportCSV = () => {
    const rows = (products || []);
    if (rows.length === 0) return;
    const header = 'Name,SKU,Price,Stock,Status,Category\n';
    const csvRows = rows.map((p: any) =>
      `"${p.name}","${p.sku || ''}",${p.price},${p.stockQuantity},${p.isActive ? 'Active' : 'Draft'},"${p.category?.name || 'Uncategorized'}"`
    ).join('\n');
    const blob = new Blob([header + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ora-products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Table columns
  const columns: Column<any>[] = [
    {
      id: 'product',
      header: 'Product',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg bg-[#f6f7f9] overflow-hidden flex-shrink-0 ${row.deletedAt ? 'opacity-50' : ''}`}>
            {row.images?.[0]?.imageUrl ? (
              <img
                src={row.images[0].imageUrl}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={20} className="text-[#9ca3af]" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className={`font-medium truncate ${row.deletedAt ? 'text-[#9ca3af] line-through' : 'text-[#111827]'}`}>{row.name}</p>
            <p className="text-xs text-[#9ca3af]">SKU: {row.sku}</p>
          </div>
        </div>
      ),
      width: '30%',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => <ProductStatusBadge isActive={row.isActive} stock={row.stockQuantity} deletedAt={row.deletedAt} />,
      width: '12%',
    },
    {
      id: 'category',
      header: 'Category',
      accessor: (row) => (
        <span className="text-sm text-[#4b5563]">
          {row.category?.name || 'Uncategorized'}
        </span>
      ),
      width: '15%',
    },
    {
      id: 'inventory',
      header: 'Inventory',
      accessor: (row) => (
        <div className="text-sm">
          <span className={`font-medium ${
            row.stockQuantity === 0 
              ? 'text-[#dc2626]' 
              : row.stockQuantity <= 5 
              ? 'text-[#f59e0b]' 
              : 'text-[#111827]'
          }`}>
            {row.stockQuantity}
          </span>
          <span className="text-[#9ca3af]"> in stock</span>
          {row.stockQuantity > 0 && row.stockQuantity <= 5 && (
            <AlertTriangle size={14} className="inline ml-1 text-[#f59e0b]" />
          )}
        </div>
      ),
      width: '12%',
    },
    {
      id: 'price',
      header: 'Price',
      align: 'right',
      accessor: (row) => (
        <div className="text-right">
          {row.discountPercent > 0 ? (
            <>
              <p className="font-medium text-[#111827]">{formatCurrency(row.finalPrice)}</p>
              <p className="text-xs text-[#9ca3af] line-through">{formatCurrency(row.price)}</p>
            </>
          ) : (
            <p className="font-medium text-[#111827]">{formatCurrency(row.price)}</p>
          )}
        </div>
      ),
      width: '12%',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Action Messages */}
        {actionMessage && (
          <Alert variant={actionMessage.type === 'success' ? 'success' : 'error'}>
            {actionMessage.text}
          </Alert>
        )}

        {/* Page Header */}
        <PageHeader
          title="Products"
          description="Manage your product catalog"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Products' },
          ]}
          actions={
            <>
              <Button variant="secondary" leftIcon={<Download size={18} />} onClick={handleExportCSV}>
                Export
              </Button>
              <Button variant="secondary" leftIcon={<Upload size={18} />}>
                Import
              </Button>
              <Link href="/admin/v2/products/new">
                <Button leftIcon={<Plus size={18} />}>
                  Add Product
                </Button>
              </Link>
            </>
          }
        />

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
                { value: 'outOfStock', label: 'Out of Stock' },
                { value: 'lowStock', label: 'Low Stock' },
              ]}
            />

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(c => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
        </Card>

        {/* Products Table */}
        <DataTable
          data={products || []}
          columns={columns}
          loading={productsLoading || actionLoading}
          selectable
          selectedRows={selectedProducts}
          onSelectionChange={setSelectedProducts}
          getRowId={(row: any) => row.id as string}
          onRowClick={(row: any) => router.push(`/admin/v2/products/${row.id as string}`)}
          bulkActions={[
            { label: 'Activate', onClick: (ids) => handleBulkAction('activate', ids), variant: 'primary' },
            { label: 'Deactivate', onClick: (ids) => handleBulkAction('deactivate', ids), variant: 'primary' },
            { label: 'Archive', onClick: (ids) => handleBulkAction('archive', ids), variant: 'danger' },
            { label: 'Restore', onClick: (ids) => handleBulkAction('restore', ids), variant: 'primary' },
          ]}
          rowActions={(row: any) => (
            <TableActions>
              <TableActionItem
                icon={<Eye size={16} />}
                onClick={() => window.open(`/products/${row.slug as string}`, '_blank')}
              >
                View in Store
              </TableActionItem>
              <TableActionItem
                icon={<Edit size={16} />}
                onClick={() => router.push(`/admin/v2/products/${row.id as string}`)}
              >
                Edit
              </TableActionItem>
              <TableActionItem
                icon={<Copy size={16} />}
                onClick={() => router.push(`/admin/v2/products/new?duplicate=${row.id}`)}
              >
                Duplicate
              </TableActionItem>
              {!row.deletedAt ? (
                <TableActionItem
                  icon={<Archive size={16} />}
                  onClick={() => handleArchive(row.id)}
                >
                  Archive
                </TableActionItem>
              ) : (
                <TableActionItem
                  icon={<RotateCcw size={16} />}
                  onClick={() => handleRestore(row.id)}
                >
                  Restore
                </TableActionItem>
              )}
              {!row.deletedAt && (
                <TableActionItem
                  icon={<Trash2 size={16} />}
                  onClick={() => handleDelete(row.id)}
                  variant="danger"
                >
                  Delete
                </TableActionItem>
              )}
            </TableActions>
          )}
          pagination={{
            page,
            pageSize,
            total: productsPagination.total,
            onPageChange: setPage,
            onPageSizeChange: () => {},
          }}
          emptyState={
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-[#9ca3af] mb-4" />
              <h3 className="text-lg font-semibold text-[#111827] mb-2">No products found</h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Get started by adding your first product
              </p>
              <Link href="/admin/v2/products/new">
                <Button leftIcon={<Plus size={18} />}>Add Product</Button>
              </Link>
            </div>
          }
        />
      </div>
    </AdminLayout>
  );
}
