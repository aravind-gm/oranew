'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle, Package, Save, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  price: number;
  category?: { name: string };
  images?: Array<{ imageUrl: string }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const fetchInventory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: Record<string, string | number | boolean> = { page, limit: 20 };
      if (search) params.search = search;
      if (showLowStock) params.lowStock = 'true';

      const response = await api.get('/admin/inventory', { params });

      if (response.data.success) {
        setProducts(response.data.data.products || []);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [search, showLowStock]);

  // Check auth on hydration
  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    
    fetchInventory();
  }, [isHydrated, token, user, router, fetchInventory]);

  const handleStockChange = (productId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedStock({ ...editedStock, [productId]: Math.max(0, numValue) });
  };

  const saveStock = async (productId: string) => {
    if (editedStock[productId] === undefined) return;
    if (!token || !isHydrated) {
      console.error('Not authenticated or hydration incomplete');
      return;
    }

    setSaving(productId);
    try {
      const response = await api.put(`/admin/inventory/${productId}`, {
        stockQuantity: editedStock[productId],
      });

      if (response.data.success) {
        setProducts(products.map(p =>
          p.id === productId ? { ...p, stockQuantity: editedStock[productId] } : p
        ));
        setEditedStock(prev => {
          const newState = { ...prev };
          delete newState[productId];
          return newState;
        });
        setSuccessMessage('Stock updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
    } finally {
      setSaving(null);
    }
  };

  const getStockStatus = (product: Product) => {
    if (product.stockQuantity === 0) {
      return { label: 'Out of Stock', color: 'bg-red-500/20 text-red-400 border-red-500/50' };
    }
    if (product.stockQuantity <= product.lowStockThreshold) {
      return { label: 'Low Stock', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
    }
    return { label: 'In Stock', color: 'bg-green-500/20 text-green-400 border-green-500/50' };
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/admin" className="text-blue-400 hover:underline mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="text-amber-500" />
              Inventory Management
            </h1>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchInventory()}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="w-4 h-4 rounded bg-gray-700 border-gray-600"
              />
              <span className="text-sm flex items-center gap-1">
                <AlertTriangle size={14} className="text-yellow-400" />
                Low Stock Only
              </span>
            </label>
            <button
              onClick={() => fetchInventory()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              Search
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading inventory...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No products found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="p-4 text-left">Product</th>
                    <th className="p-4 text-left">SKU</th>
                    <th className="p-4 text-left">Category</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Current Stock</th>
                    <th className="p-4 text-center">Update Stock</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const status = getStockStatus(product);
                    const currentValue = editedStock[product.id] ?? product.stockQuantity;
                    const hasChanges = editedStock[product.id] !== undefined;

                    return (
                      <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-750">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] ? (
                              <Image
                                src={product.images[0].imageUrl}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                                <Package size={16} className="text-gray-500" />
                              </div>
                            )}
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 text-sm font-mono">{product.sku}</td>
                        <td className="p-4 text-gray-400">{product.category?.name || '-'}</td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-bold ${product.stockQuantity === 0 ? 'text-red-400' : 'text-white'}`}>
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="0"
                            value={currentValue}
                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                            className={`w-24 mx-auto block px-3 py-2 bg-gray-700 border rounded text-center ${
                              hasChanges ? 'border-amber-500' : 'border-gray-600'
                            }`}
                          />
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => saveStock(product.id)}
                            disabled={!hasChanges || saving === product.id}
                            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 mx-auto ${
                              hasChanges
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <Save size={16} />
                            {saving === product.id ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchInventory(page)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  page === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
