'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
    AlertTriangle,
    Check,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    EyeOff,
    Filter,
    Package,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface ProductImage {
  imageUrl: string;
  isPrimary: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  finalPrice: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  category?: {
    name: string;
  };
  images?: ProductImage[];
}

interface Category {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Action modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | string[] | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    fetchCategories();
  }, [isHydrated, token, user, router]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, limit: 20 };
      
      if (searchQuery) params.search = searchQuery;
      if (categoryFilter) params.category = categoryFilter;
      if (stockFilter === 'low') params.lowStock = 'true';
      if (stockFilter === 'out') params.outOfStock = 'true';
      if (statusFilter === 'active') params.isActive = 'true';
      if (statusFilter === 'inactive') params.isActive = 'false';
      
      const response = await api.get('/admin/products', { params });
      
      if (response.data.success) {
        setProducts(response.data.data?.products || []);
        setPagination(response.data.data?.pagination || null);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, stockFilter, statusFilter]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (token && user?.role === 'ADMIN') {
      fetchProducts();
    }
  }, [isHydrated, token, user, fetchProducts]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchProducts]);

  // Handle selection
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === products.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
    setSelectAll(!selectAll);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (!token || !isHydrated) {
      setActionError('Authentication not ready. Please refresh and try again.');
      return;
    }
    
    setActionLoading(true);
    setActionError('');
    
    try {
      const idsToDelete = Array.isArray(deleteTarget) ? deleteTarget : [deleteTarget];
      
      for (const id of idsToDelete) {
        await api.delete(`/admin/products/${id}`);
      }
      
      // Clear selection
      setSelectedProducts(new Set());
      setSelectAll(false);
      
      // Refresh products
      await fetchProducts(pagination?.page || 1);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setActionError(err.response?.data?.message || 'Failed to delete products');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk status toggle
  const handleBulkStatusToggle = async (activate: boolean) => {
    if (selectedProducts.size === 0) return;

    if (!token || !isHydrated) {
      setActionError('Authentication not ready. Please refresh and try again.');
      return;
    }
    
    setActionLoading(true);
    setActionError('');
    
    try {
      const promises = Array.from(selectedProducts).map(id =>
        api.put(`/admin/products/${id}`, { isActive: activate })
      );
      await Promise.all(promises);
      
      // Refresh products
      await fetchProducts(pagination?.page || 1);
      setSelectedProducts(new Set());
      setSelectAll(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setActionError(err.response?.data?.message || 'Failed to update products');
    } finally {
      setActionLoading(false);
    }
  };

  // Single product status toggle
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/products/${productId}`, { isActive: !currentStatus });
      setProducts(products.map(p =>
        p.id === productId ? { ...p, isActive: !currentStatus } : p
      ));
    } catch (error) {
      console.error('Failed to toggle product status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockBadge = (qty: number) => {
    if (qty === 0) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-900/50 text-red-300">Out of Stock</span>;
    } else if (qty <= 10) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/50 text-yellow-300">Low Stock ({qty})</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-900/50 text-green-300">{qty} in stock</span>;
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Link href="/admin" className="text-blue-400 hover:underline text-sm mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Package className="text-amber-500" />
                Products Management
              </h1>
            </div>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg font-semibold transition"
            >
              <Plus size={20} />
              Add Product
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {actionError && (
          <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-400 flex items-center gap-2">
              <AlertTriangle size={20} />
              {actionError}
            </p>
            <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-300">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                showFilters ? 'bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Stock Status</label>
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Stock Levels</option>
                  <option value="low">Low Stock (≤10)</option>
                  <option value="out">Out of Stock</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedProducts.size > 0 && (
          <div className="bg-gray-800 border border-amber-600/50 rounded-lg p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <span className="text-amber-400 font-medium">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusToggle(true)}
                disabled={actionLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded text-sm transition"
              >
                <Eye size={16} />
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusToggle(false)}
                disabled={actionLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-sm transition"
              >
                <EyeOff size={16} />
                Deactivate
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(Array.from(selectedProducts));
                  setShowDeleteModal(true);
                }}
                disabled={actionLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-700 hover:bg-red-600 rounded text-sm transition"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={() => {
                  setSelectedProducts(new Set());
                  setSelectAll(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
              >
                <X size={16} />
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-gray-400">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-4 text-gray-500" size={48} />
              <p className="text-gray-400 mb-4">No products found</p>
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded-lg transition"
              >
                <Plus size={20} />
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50 border-b border-gray-700">
                  <tr>
                    <th className="w-12 p-4">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-amber-500"
                      />
                    </th>
                    <th className="text-left p-4 font-medium">Product</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Price</th>
                    <th className="text-left p-4 font-medium">Stock</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-amber-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-gray-700 overflow-hidden flex-shrink-0">
                            {product.images && product.images[0]?.imageUrl ? (
                              <Image
                                src={product.images[0].imageUrl}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Package size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="font-medium hover:text-amber-400 transition"
                            >
                              {product.name}
                            </Link>
                            {product.isFeatured && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-600/30 text-amber-400 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">
                        {product.category?.name || '-'}
                      </td>
                      <td className="p-4">
                        <div>
                          <span className="font-semibold">{formatCurrency(Number(product.finalPrice || product.price))}</span>
                          {product.finalPrice && product.finalPrice < product.price && (
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              {formatCurrency(Number(product.price))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStockBadge(product.stockQuantity)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => toggleProductStatus(product.id, product.isActive)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition ${
                            product.isActive
                              ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {product.isActive ? (
                            <>
                              <Check size={14} />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition"
                            title="View on site"
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="p-2 bg-blue-700 hover:bg-blue-600 rounded transition"
                            title="Edit product"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteTarget(product.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 bg-red-700 hover:bg-red-600 rounded transition"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <p className="text-gray-400 text-sm">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let page = i + 1;
                  if (pagination.pages > 5) {
                    if (pagination.page > 3) {
                      page = pagination.page - 2 + i;
                    }
                    if (page > pagination.pages) {
                      page = pagination.pages - 4 + i;
                    }
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => fetchProducts(page)}
                      className={`w-10 h-10 rounded-lg transition ${
                        pagination.page === page
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => fetchProducts(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/30 rounded-full">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-bold">Delete Product{Array.isArray(deleteTarget) && deleteTarget.length > 1 ? 's' : ''}</h3>
            </div>
            
            <p className="text-gray-400 mb-6">
              {Array.isArray(deleteTarget)
                ? `Are you sure you want to delete ${deleteTarget.length} selected products? This action cannot be undone.`
                : 'Are you sure you want to delete this product? This action cannot be undone.'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
