'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

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
      } else {
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    if (!token || !isHydrated) {
      setError('Authentication not ready. Please refresh and try again.');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      const response = await api.post('/admin/categories', {
        name: newCategory.name,
        slug: newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, '-'),
        description: newCategory.description,
      });
      
      if (response.data.success) {
        setCategories([...categories, response.data.data]);
        setNewCategory({ name: '', slug: '', description: '' });
      }
    } catch (error: unknown) {
      console.error('Failed to add category:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to add category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (categoryId: string) => {
    if (!editForm.name.trim()) return;

    if (!token || !isHydrated) {
      setError('Authentication not ready. Please refresh and try again.');
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      const response = await api.put(`/admin/categories/${categoryId}`, {
        name: editForm.name,
        description: editForm.description,
      });
      
      if (response.data.success) {
        setCategories(categories.map(c => 
          c.id === categoryId ? { ...c, ...response.data.data } : c
        ));
        setEditingId(null);
      }
    } catch (error: unknown) {
      console.error('Failed to update category:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    if (!token || !isHydrated) {
      setError('Authentication not ready. Please refresh and try again.');
      return;
    }
    
    setError('');
    
    try {
      const response = await api.delete(`/admin/categories/${categoryId}`);
      if (response.data.success) {
        setCategories(categories.filter(c => c.id !== categoryId));
      }
    } catch (error: unknown) {
      console.error('Failed to delete category:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message || 'Failed to delete category. It may have products assigned.');
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditForm({ name: category.name, description: category.description || '' });
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8">Categories Management</h1>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="mb-8 bg-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Rings"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug (auto-generated)</label>
                <input
                  type="text"
                  placeholder="e.g., rings"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                placeholder="Category description..."
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                rows={2}
                className="w-full bg-gray-600 border border-gray-500 rounded px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !newCategory.name.trim()}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold transition"
            >
              {saving ? 'Adding...' : 'Add Category'}
            </button>
          </form>

          {/* Categories List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-400 mt-2">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No categories found. Add your first category above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-600">
                  <tr>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Slug</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="py-3 px-4">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white w-full"
                          />
                        ) : (
                          <span className="font-medium">{category.name}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-sm">{category.slug}</td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {editingId === category.id ? (
                          <input
                            type="text"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white w-full"
                          />
                        ) : (
                          category.description || '-'
                        )}
                      </td>
                      <td className="text-right py-3 px-4">
                        {editingId === category.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(category.id)}
                              disabled={saving}
                              className="text-green-400 hover:text-green-300 transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-400 hover:text-gray-300 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-4">
                            <button
                              onClick={() => startEdit(category)}
                              className="text-blue-400 hover:text-blue-300 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="text-red-400 hover:text-red-300 transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
