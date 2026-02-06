'use client';

/**
 * ORA Admin Panel - Products List Page
 * =====================================
 * 
 * Full product management with Shopify-level controls
 * Filters, bulk actions, status management
 */

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '../components/AdminLayout';
import { PageHeader, Button, Badge, Input, Select, Card } from '../components/ui';
import { DataTable, TableActions, TableActionItem, Column } from '../components/ui/DataTable';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
  MoreHorizontal,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

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

const ProductStatusBadge = ({ isActive, stock }: { isActive: boolean; stock: number }) => {
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
  const { products, productsLoading, fetchProducts } = useAdminStore();
  
  // State
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Fetch products on mount and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle delete (not implemented yet)
  const handleDelete = async (productId: string) => {
    // Delete functionality to be implemented with API
    console.log('Delete product:', productId);
  };

  // Handle bulk delete (not implemented yet)
  const handleBulkDelete = async (ids: string[]) => {
    console.log('Delete products:', ids);
    setSelectedProducts([]);
  };

  // Filter products
  const filteredProducts = (products || []).filter((product: any) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !product.name.toLowerCase().includes(query) &&
        !product.sku.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !product.isActive) return false;
      if (statusFilter === 'draft' && product.isActive) return false;
      if (statusFilter === 'outOfStock' && product.stockQuantity > 0) return false;
      if (statusFilter === 'lowStock' && (product.stockQuantity === 0 || product.stockQuantity > 5)) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && product.category?.id !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Paginated products
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Table columns
  const columns: Column<any>[] = [
    {
      id: 'product',
      header: 'Product',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#f6f7f9] overflow-hidden flex-shrink-0">
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
            <p className="font-medium text-[#111827] truncate">{row.name}</p>
            <p className="text-xs text-[#9ca3af]">SKU: {row.sku}</p>
          </div>
        </div>
      ),
      width: '30%',
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => <ProductStatusBadge isActive={row.isActive} stock={row.stockQuantity} />,
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
              <Button variant="secondary" leftIcon={<Download size={18} />}>
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
                // Categories will be loaded from API
              ]}
            />
          </div>
        </Card>

        {/* Products Table */}
        <DataTable
          data={paginatedProducts}
          columns={columns}
          loading={productsLoading}
          selectable
          selectedRows={selectedProducts}
          onSelectionChange={setSelectedProducts}
          getRowId={(row: any) => row.id as string}
          onRowClick={(row: any) => router.push(`/admin/v2/products/${row.id as string}`)}
          bulkActions={[
            { label: 'Delete', onClick: handleBulkDelete, variant: 'danger' },
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
              <TableActionItem
                icon={<Archive size={16} />}
                onClick={() => {}}
              >
                Archive
              </TableActionItem>
              <TableActionItem
                icon={<Trash2 size={16} />}
                onClick={() => handleDelete(row.id)}
                variant="danger"
              >
                Delete
              </TableActionItem>
            </TableActions>
          )}
          pagination={{
            page,
            pageSize,
            total: filteredProducts.length,
            onPageChange: setPage,
            onPageSizeChange: setPageSize,
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
