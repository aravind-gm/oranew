'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Loader2, Trash2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPercent: number;
  categoryId: string;
  material: string;
  careInstructions: string;
  weight: string;
  dimensions: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  images: ProductImage[];
  category?: Category;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { token, user, isHydrated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<{ url: string; alt: string; isPrimary: boolean }[]>([]);
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPercent: '0',
    categoryId: '',
    material: '',
    careInstructions: '',
    weight: '',
    dimensions: '',
    stockQuantity: '0',
    lowStockThreshold: '5',
    isFeatured: false,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  });

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/admin/products/${params.id}`);
      const product: Product = response.data.success ? response.data.data : response.data;
      
      setForm({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price?.toString() || '0',
        discountPercent: product.discountPercent?.toString() || '0',
        categoryId: product.categoryId || '',
        material: product.material || '',
        careInstructions: product.careInstructions || '',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        stockQuantity: product.stockQuantity?.toString() || '0',
        lowStockThreshold: product.lowStockThreshold?.toString() || '5',
        isFeatured: product.isFeatured || false,
        isActive: product.isActive ?? true,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
      });
      setImages(product.images || []);
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!token || user?.role !== 'ADMIN') {
      router.push('/admin/login');
      return;
    }
    fetchProduct();
    fetchCategories();
  }, [isHydrated, token, user, router, fetchProduct]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!token || !isHydrated) {
      setError('Authentication not ready. Please refresh and try again.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      const response = await api.post('/upload/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const uploadedImages = response.data.data.urls.map((url: string) => ({
          url,
          alt: form.name || 'Product image',
          isPrimary: images.length === 0 && newImages.length === 0,
        }));
        setNewImages([...newImages, ...uploadedImages]);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeExistingImage = (imageId: string) => {
    const imageToRemove = images.find(img => img.id === imageId);
    setImages(images.filter(img => img.id !== imageId));
    setDeletedImageIds([...deletedImageIds, imageId]);
    
    // If we removed the primary image, set another one as primary
    if (imageToRemove?.isPrimary) {
      const remaining = images.filter(img => img.id !== imageId);
      if (remaining.length > 0) {
        remaining[0].isPrimary = true;
        setImages([...remaining]);
      } else if (newImages.length > 0) {
        newImages[0].isPrimary = true;
        setNewImages([...newImages]);
      }
    }
  };

  const removeNewImage = (index: number) => {
    const removed = newImages[index];
    const updated = newImages.filter((_, i) => i !== index);
    
    if (removed.isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    } else if (removed.isPrimary && images.length > 0) {
      images[0].isPrimary = true;
      setImages([...images]);
    }
    setNewImages(updated);
  };

  const setPrimaryImage = (type: 'existing' | 'new', index: number) => {
    // Clear all primary flags
    const updatedImages = images.map(img => ({ ...img, isPrimary: false }));
    const updatedNewImages = newImages.map(img => ({ ...img, isPrimary: false }));
    
    if (type === 'existing') {
      updatedImages[index].isPrimary = true;
    } else {
      updatedNewImages[index].isPrimary = true;
    }
    
    setImages(updatedImages);
    setNewImages(updatedNewImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !isHydrated) {
      setError('Authentication not ready. Please refresh and try again.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Validate required fields
      if (!form.name.trim()) {
        throw new Error('Product name is required');
      }
      if (!form.price || parseFloat(form.price) <= 0) {
        throw new Error('Valid price is required');
      }
      if (!form.categoryId) {
        throw new Error('Category is required');
      }

      // Delete removed images
      for (const imageId of deletedImageIds) {
        try {
          await api.delete(`/admin/products/${params.id}/images/${imageId}`);
        } catch {
          console.error('Failed to delete image:', imageId);
        }
      }

      // Prepare all images (existing + new)
      const allImages = [
        ...images.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt || form.name,
          isPrimary: img.isPrimary,
        })),
        ...newImages.map(img => ({
          url: img.url,
          alt: img.alt || form.name,
          isPrimary: img.isPrimary,
        })),
      ];

      // Validate before sending
      const validationErrors: string[] = [];
      if (!form.name || !form.name.trim()) validationErrors.push('Product name is required');
      if (!form.price || isNaN(parseFloat(form.price))) validationErrors.push('Price must be a valid number');
      if (parseFloat(form.price) <= 0) validationErrors.push('Price must be greater than 0');
      if (!form.categoryId) validationErrors.push('Category is required');
      if (form.stockQuantity && (isNaN(parseInt(form.stockQuantity)) || parseInt(form.stockQuantity) < 0)) {
        validationErrors.push('Stock quantity must be a non-negative number');
      }
      if (form.discountPercent && (isNaN(parseFloat(form.discountPercent)) || parseFloat(form.discountPercent) < 0 || parseFloat(form.discountPercent) > 100)) {
        validationErrors.push('Discount percentage must be between 0-100');
      }

      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'));
        setSaving(false);
        return;
      }

      console.log('[Admin Edit] 📝 Submitting product update...');

      const productData = {
        name: form.name.trim(),
        description: form.description,
        shortDescription: form.shortDescription,
        price: parseFloat(form.price),
        discountPercent: parseFloat(form.discountPercent || '0'),
        categoryId: form.categoryId,
        material: form.material,
        careInstructions: form.careInstructions,
        weight: form.weight,
        dimensions: form.dimensions,
        stockQuantity: parseInt(form.stockQuantity || '0'),
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        images: allImages,
      };

      console.log('[Admin Edit] 📤 Product data:', productData);

      const response = await api.put(`/admin/products/${params.id}`, productData);
      
      console.log('[Admin Edit] ✅ Update response:', response.data);
      
      if (response.data.success) {
        console.log('[Admin Edit] ✅ Product updated successfully');
        router.push('/admin/products');
      }
    } catch (err: unknown) {
      console.error('[Admin Edit] ❌ Failed to update product:', err);
      const error = err as { 
        message?: string; 
        response?: { 
          status?: number;
          data?: { message?: string } 
        } 
      };
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update product';
      const statusCode = error.response?.status;
      
      if (statusCode === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (statusCode === 403) {
        setError('You do not have permission to update products.');
      } else if (statusCode === 400) {
        setError(errorMessage);
      } else if (statusCode === 404) {
        setError('Product not found.');
      } else if (statusCode === 500) {
        setError(`Server error: ${errorMessage}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/products" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Back to Products
        </Link>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center justify-between">
              <p className="text-red-400">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <X size={20} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g., Gold Diamond Ring"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Material</label>
                  <input
                    type="text"
                    value={form.material}
                    onChange={(e) => setForm({ ...form, material: e.target.value })}
                    placeholder="e.g., 18K Gold, Sterling Silver"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Short Description</label>
                  <input
                    type="text"
                    value={form.shortDescription}
                    onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                    placeholder="Brief product tagline (max 500 chars)"
                    maxLength={500}
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Full Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Detailed product description..."
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Discount %</label>
                  <input
                    type="number"
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  />
                </div>

                {form.price && form.discountPercent && parseFloat(form.discountPercent) > 0 && (
                  <div className="md:col-span-4 text-sm text-green-400">
                    Final Price: ₹{(parseFloat(form.price) * (1 - parseFloat(form.discountPercent) / 100)).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Images */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Product Images</h2>
              
              <div className="mb-4">
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-500 rounded-lg cursor-pointer hover:border-amber-500 transition">
                  <div className="text-center">
                    {uploading ? (
                      <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    ) : (
                      <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                    )}
                    <p className="text-gray-400">
                      {uploading ? 'Uploading...' : 'Click to upload new images'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {(images.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Existing images */}
                  {images.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt={img.alt}
                        className={`w-full h-32 object-cover rounded-lg ${img.isPrimary ? 'ring-2 ring-amber-500' : ''}`}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage('existing', index)}
                          className={`px-2 py-1 rounded text-xs ${img.isPrimary ? 'bg-amber-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                        >
                          {img.isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="p-1 bg-red-600 rounded hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* New images */}
                  {newImages.map((img, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={img.url}
                        alt={img.alt}
                        className={`w-full h-32 object-cover rounded-lg ${img.isPrimary ? 'ring-2 ring-amber-500' : ''}`}
                      />
                      <div className="absolute top-1 left-1 bg-green-600 text-xs px-1 rounded">New</div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage('new', index)}
                          className={`px-2 py-1 rounded text-xs ${img.isPrimary ? 'bg-amber-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                        >
                          {img.isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="p-1 bg-red-600 rounded hover:bg-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Weight</label>
                  <input
                    type="text"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    placeholder="e.g., 5.2 grams"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={form.dimensions}
                    onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                    placeholder="e.g., Ring Size: 16"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Care Instructions</label>
                  <textarea
                    value={form.careInstructions}
                    onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
                    rows={2}
                    placeholder="How to care for this product..."
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">SEO (Optional)</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    placeholder="SEO page title"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Meta Description</label>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    rows={2}
                    placeholder="SEO description for search engines"
                    className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Product Options</h2>
              
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-500 bg-gray-600 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Featured Product</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-500 bg-gray-600 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Active (Visible in store)</span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
              >
                {saving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <Link
                href="/admin/products"
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
