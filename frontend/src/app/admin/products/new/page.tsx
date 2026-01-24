'use client';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UploadedImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const { token, user, isHydrated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!token || !isHydrated) {
      setError('❌ Authentication not ready. Please refresh the page and try again.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      console.log('[Admin] Starting image upload...', {
        fileCount: files.length,
        hasToken: !!token,
        isHydrated,
      });

      // CRITICAL: Do NOT explicitly set Content-Type header for multipart/form-data
      // Axios will automatically set it with the correct boundary parameter
      // Manually setting it will OVERRIDE the Authorization header
      const response = await api.post('/upload/images', formData);

      if (response.data.success) {
        console.log('[Admin] Image upload successful:', {
          uploadedCount: response.data.data.urls.length,
          imageUrls: response.data.data.urls,
        });

        const newImages = response.data.data.urls.map((url: string, index: number) => ({
          url,
          alt: form.name || 'Product image',
          isPrimary: images.length === 0 && index === 0,
        }));
        setImages([...images, ...newImages]);
      }
    } catch (error: unknown) {
      console.error('[Admin] Image upload failed:', error);
      const err = error as { 
        response?: { 
          status?: number;
          data?: { message?: string; error?: { message?: string } };
        };
        message?: string;
      };

      let errorMsg = 'Failed to upload images';
      
      if (err.response?.status === 401) {
        errorMsg = '❌ Unauthorized - Your token may have expired. Please re-login and try again.';
      } else if (err.response?.status === 403) {
        errorMsg = '❌ Access Denied - You do not have permission to upload images. Only Admins can upload.';
      } else if (err.response?.data?.error?.message) {
        errorMsg = `❌ ${err.response.data.error.message}`;
      } else if (err.response?.data?.message) {
        errorMsg = `❌ ${err.response.data.message}`;
      } else if (err.message) {
        errorMsg = `❌ ${err.message}`;
      }

      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // If we removed the primary image, make the first one primary
    if (images[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    setImages(newImages);
  };

  const setPrimaryImage = (index: number) => {
    setImages(images.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !isHydrated) {
      setError('❌ Authentication not ready. Please refresh the page and try again.');
      return;
    }

    // Validate all required fields BEFORE sending
    const validationErrors: string[] = [];

    if (!form.name.trim()) {
      validationErrors.push('Product name is required');
    }

    if (!form.price || parseFloat(form.price) <= 0) {
      validationErrors.push('Price must be greater than 0');
    }

    if (isNaN(parseFloat(form.price))) {
      validationErrors.push('Price must be a valid number');
    }

    if (!form.categoryId) {
      validationErrors.push('Category is required');
    }

    if (images.length === 0) {
      validationErrors.push('At least one image is required');
    }

    const stockQty = parseInt(form.stockQuantity);
    if (isNaN(stockQty) || stockQty < 0) {
      validationErrors.push('Stock quantity must be a non-negative number');
    }

    const discountPct = parseFloat(form.discountPercent || '0');
    if (discountPct < 0 || discountPct > 100) {
      validationErrors.push('Discount must be between 0% and 100%');
    }

    if (validationErrors.length > 0) {
      setError(`❌ Form Validation Failed:\n${validationErrors.map(e => `• ${e}`).join('\n')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const productData = {
        name: form.name,
        description: form.description,
        shortDescription: form.shortDescription,
        price: form.price,
        discountPercent: form.discountPercent || '0',
        categoryId: form.categoryId,
        material: form.material,
        careInstructions: form.careInstructions,
        weight: form.weight,
        dimensions: form.dimensions,
        stockQuantity: form.stockQuantity || '0',
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        images: images.map((img) => ({
          url: img.url,
          alt: img.alt || form.name,
          isPrimary: img.isPrimary,
        })),
      };

      console.log('[Admin] Submitting product creation request...', {
        productName: form.name,
        imageCount: images.length,
        hasToken: !!token,
        isHydrated,
        endpoint: '/admin/products',
      });

      const response = await api.post('/admin/products', productData);
      
      if (response.data.success) {
        console.log('[Admin] ✅ Product created successfully:', {
          productId: response.data.data.id,
          productName: response.data.data.name,
        });
        router.push('/admin/products');
      } else {
        throw new Error(response.data.message || 'Product creation failed');
      }
    } catch (err: unknown) {
      console.error('[Admin] Product creation failed:', err);
      
      const error = err as {
        message?: string;
        response?: {
          status?: number;
          data?: { message?: string; error?: { message?: string } };
        };
      };

      let errorMsg = 'Failed to create product';
      
      if (error.response?.status === 401) {
        errorMsg = '❌ Unauthorized - Your token may have expired. Please re-login and try again.';
      } else if (error.response?.status === 403) {
        errorMsg = '❌ Access Denied - You do not have Admin permission to create products.';
      } else if (error.response?.status === 400) {
        errorMsg = `❌ Invalid Data: ${error.response?.data?.error?.message || error.response?.data?.message || 'Check your form inputs'}`;
      } else if (error.response?.data?.error?.message) {
        errorMsg = `❌ ${error.response.data.error.message}`;
      } else if (error.response?.data?.message) {
        errorMsg = `❌ ${error.response.data.message}`;
      } else if (error.message) {
        errorMsg = `❌ ${error.message}`;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!token || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin/products" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Back to Products
        </Link>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h1 className="text-2xl font-bold mb-6">Create New Product</h1>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {error.includes('\n') ? (
                    <ul className="text-red-400 text-sm space-y-1">
                      {error.split('\n').map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-red-400">{error}</p>
                  )}
                </div>
                <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 flex-shrink-0">
                  <X size={20} />
                </button>
              </div>
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
                      {uploading ? 'Uploading...' : 'Click to upload images'}
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

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={img.url}
                        alt={img.alt}
                        width={200}
                        height={128}
                        className={`w-full h-32 object-cover rounded-lg ${img.isPrimary ? 'ring-2 ring-amber-500' : ''}`}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className={`px-2 py-1 rounded text-xs ${img.isPrimary ? 'bg-amber-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                        >
                          {img.isPrimary ? 'Primary' : 'Set Primary'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
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
                disabled={loading}
                className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 rounded-lg font-semibold transition"
              >
                {loading ? 'Creating Product...' : 'Create Product'}
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
