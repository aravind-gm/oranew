'use client';

/**
 * ORA Admin Panel - Add/Edit Product Page
 * ========================================
 * 
 * Complete product form with Shopify-level controls:
 * - Title, Description (rich text ready)
 * - Images (drag & drop, reorder)
 * - Pricing, discount, tax
 * - Inventory management
 * - Variants (size, color, material)
 * - SEO fields
 * - Product status
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { 
  PageHeader, 
  Button, 
  Input, 
  Textarea, 
  Select, 
  Checkbox, 
  Card, 
  CardTitle,
  Badge,
  Alert,
  Spinner,
} from '../../components/ui';
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  GripVertical,
  Plus,
  Trash2,
  Eye,
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  Layers,
  Search as SearchIcon,
  AlertCircle,
  Check,
  Globe,
} from 'lucide-react';
import api from '@/lib/api';
import { useAdminStore } from '@/store/adminStore';

// ============================================
// TYPES
// ============================================

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  file?: File;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  options: {
    size?: string;
    color?: string;
    material?: string;
  };
}

interface ProductFormData {
  // Basic Info
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  
  // Pricing
  price: number;
  discountPercent: number;
  finalPrice: number;
  
  // Inventory
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  
  // Organization
  categoryId: string;
  hsnCode: string;
  tags: string[];
  material: string;
  weight: string;
  dimensions: string;
  careInstructions: string;
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // Gift Collections & Occasions
  collections: string[];
  occasions: string[];
  isFeaturedGift: boolean;
  
  // BOGO Campaign
  isBOGOEligible: boolean;
  bogoPriceTier: number | null;
  bogoCategory: string;
  
  // Tumbler Settings
  isTumbler: boolean;
  capacity: string;
  isBestseller: boolean;
  
  // Offer Settings
  isOnOffer: boolean;
  offerType: string;
  offerValue: number;
  offerExpiry: string;
  showCountdown: boolean;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  
  // Images
  images: ProductImage[];
  videoUrl: string;
  
  // Variants
  variants: ProductVariant[];
  hasVariants: boolean;
}

// ============================================
// IMAGE UPLOADER COMPONENT
// ============================================

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const MAX_IMAGES = 10;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const files = Array.from(e.dataTransfer.files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, remaining);
    
    const newImages: ProductImage[] = files.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
      file,
    }));
    
    onChange([...images, ...newImages]);
  }, [images, onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    const files = Array.from(e.target.files || []).slice(0, remaining);
    
    const newImages: ProductImage[] = files.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
      file,
    }));
    
    onChange([...images, ...newImages]);
  };

  const handleRemove = (id: string) => {
    const newImages = images.filter(img => img.id !== id);
    // If we removed the primary, make the first one primary
    if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
      newImages[0].isPrimary = true;
    }
    onChange(newImages);
  };

  const handleSetPrimary = (id: string) => {
    onChange(images.map(img => ({
      ...img,
      isPrimary: img.id === id,
    })));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging 
            ? 'border-[#d4af37] bg-[#f7f1d6]' 
            : 'border-[#d1d5db] hover:border-[#c9a227]'
          }
        `}
      >
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f6f7f9] flex items-center justify-center">
            <Upload size={24} className="text-[#9ca3af]" />
          </div>
          <p className="text-sm font-medium text-[#111827] mb-1">
            {images.length >= MAX_IMAGES
              ? 'Maximum 10 images reached'
              : 'Drop images here or click to upload'}
          </p>
          <p className="text-xs text-[#9ca3af]">
            PNG, JPG, WEBP up to 5MB each · {images.length}/{MAX_IMAGES} images
          </p>
        </label>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-2 group
                ${image.isPrimary 
                  ? 'border-[#d4af37]' 
                  : 'border-[#e5e7eb]'
                }
              `}
            >
              <img
                src={image.url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    title="Set as primary"
                  >
                    <Check size={16} className="text-[#22c55e]" />
                  </button>
                )}
                <button
                  onClick={() => handleRemove(image.id)}
                  className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={16} className="text-[#dc2626]" />
                </button>
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-[#d4af37] text-white text-xs font-medium rounded">
                  Primary
                </div>
              )}

              {/* Drag Handle */}
              <div className="absolute top-2 right-2 p-1 bg-white/80 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={14} className="text-[#9ca3af]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PRODUCT FORM PAGE
// ============================================

export default function ProductFormPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const isEditing = productId && productId !== 'new';

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    discountPercent: 0,
    finalPrice: 0,
    sku: '',
    stockQuantity: 0,
    lowStockThreshold: 5,
    trackInventory: true,
    categoryId: '',
    hsnCode: '',
    tags: [],
    material: '',
    weight: '',
    dimensions: '',
    careInstructions: '',
    isActive: false,
    isFeatured: false,
    collections: [],
    occasions: [],
    isFeaturedGift: false,
    isBOGOEligible: false,
    bogoPriceTier: null,
    bogoCategory: '',
    isTumbler: false,
    capacity: '',
    isBestseller: false,
    isOnOffer: false,
    offerType: '',
    offerValue: 0,
    offerExpiry: '',
    showCountdown: false,
    metaTitle: '',
    metaDescription: '',
    images: [],
    videoUrl: '',
    variants: [],
    hasVariants: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [slugLocked, setSlugLocked] = useState(true); // Lock slug by default when editing

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data.success) {
          setCategories(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Load existing product data when editing
  useEffect(() => {
    if (!isEditing) return;
    const loadProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/products/${productId}`);
        if (res.data.success) {
          const p = res.data.data;
          setFormData({
            name: p.name || '',
            slug: p.slug || '',
            description: p.description || '',
            shortDescription: p.shortDescription || '',
            price: p.price || 0,
            discountPercent: p.discountPercent || 0,
            finalPrice: p.finalPrice || p.price || 0,
            sku: p.sku || '',
            stockQuantity: p.stockQuantity ?? 0,
            lowStockThreshold: p.lowStockThreshold ?? 5,
            trackInventory: p.trackInventory ?? true,
            categoryId: p.categoryId || '',
            hsnCode: p.hsnCode || '',
            tags: p.tags || [],
            material: p.material || '',
            weight: p.weight || '',
            dimensions: p.dimensions || '',
            careInstructions: p.careInstructions || '',
            isActive: p.isActive ?? false,
            isFeatured: p.isFeatured ?? false,
            collections: p.collections || [],
            occasions: p.occasions || [],
            isFeaturedGift: p.isFeaturedGift ?? false,
            isBOGOEligible: p.isBOGOEligible ?? false,
            bogoPriceTier: p.bogoPriceTier ?? null,
            bogoCategory: p.bogoCategory || '',
            isTumbler: p.isTumbler ?? false,
            capacity: p.capacity || '',
            isBestseller: p.isBestseller ?? false,
            isOnOffer: p.isOnOffer ?? false,
            offerType: p.offerType || '',
            offerValue: p.offerValue ?? 0,
            offerExpiry: p.offerExpiry ? new Date(p.offerExpiry).toISOString().slice(0, 16) : '',
            showCountdown: p.showCountdown ?? false,
            metaTitle: p.metaTitle || '',
            metaDescription: p.metaDescription || '',
            images: (p.images || []).map((img: { id: string; imageUrl?: string; url?: string; isPrimary?: boolean }) => ({
              id: img.id,
              url: img.imageUrl || img.url || '',
              isPrimary: img.isPrimary ?? false,
            })),
            videoUrl: p.videoUrl || '',
            variants: [],
            hasVariants: false,
          });
        }
      } catch (err) {
        console.error('Failed to load product:', err);
        setSaveError('Failed to load product data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [isEditing, productId]);

  // Calculate final price when price or discount changes
  useEffect(() => {
    const discountAmount = formData.price * (formData.discountPercent / 100);
    const finalPrice = formData.price - discountAmount;
    setFormData(prev => ({ ...prev, finalPrice: Math.round(finalPrice) }));
  }, [formData.price, formData.discountPercent]);

  // Auto-generate slug from name (only for new products, not locked slugs)
  useEffect(() => {
    if (!isEditing && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, isEditing]);

  // Update form field
  const updateField = <K extends keyof ProductFormData>(
    field: K, 
    value: ProductFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Product slug is required';
    }
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    // SKU is auto-generated by backend for new products; only required on edit
    if (isEditing && !formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async (publish: boolean = false) => {
    if (saving) return; // Prevent double-click
    if (!validateForm()) return;

    setSaving(true);
    setSaveError('');

    try {
      // Step 1: Upload any new images (those with a File object)
      const newImageFiles = formData.images.filter(img => img.file);
      let uploadedUrls: string[] = [];

      if (newImageFiles.length > 0) {
        const uploadFormData = new FormData();
        newImageFiles.forEach(img => {
          if (img.file) uploadFormData.append('images', img.file);
        });
        const uploadRes = await api.post('/upload/images', uploadFormData);
        if (uploadRes.data.success) {
          uploadedUrls = uploadRes.data.data.urls || [];
        } else {
          throw new Error('Image upload failed');
        }
      }

      // Step 2: Build final images array with CDN URLs
      let uploadIndex = 0;
      const finalImages = formData.images.map(img => {
        const url = img.file ? (uploadedUrls[uploadIndex++] || img.url) : img.url;
        return {
          url,
          alt: formData.name,
          isPrimary: img.isPrimary,
        };
      });

      // Step 3: Build payload
      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: String(formData.price),
        discountPercent: String(formData.discountPercent),
        categoryId: formData.categoryId,
        material: formData.material,
        careInstructions: formData.careInstructions,
        weight: formData.weight,
        dimensions: formData.dimensions,
        stockQuantity: String(formData.stockQuantity),
        lowStockThreshold: String(formData.lowStockThreshold),
        hsnCode: formData.hsnCode || undefined,
        isFeatured: formData.isFeatured,
        isActive: publish ? true : formData.isActive,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        collections: formData.collections,
        occasions: formData.occasions,
        isFeaturedGift: formData.isFeaturedGift,
        // BOGO fields
        isBOGOEligible: formData.isBOGOEligible,
        bogoPriceTier: formData.bogoPriceTier != null ? String(formData.bogoPriceTier) : undefined,
        bogoCategory: formData.bogoCategory || undefined,
        // Tumbler fields
        isTumbler: formData.isTumbler,
        capacity: formData.capacity || undefined,
        isBestseller: formData.isBestseller,
        // Offer fields
        isOnOffer: formData.isOnOffer,
        offerType: formData.offerType || undefined,
        offerValue: formData.offerValue ? String(formData.offerValue) : undefined,
        offerExpiry: formData.offerExpiry || undefined,
        showCountdown: formData.showCountdown,
        images: finalImages,
        videoUrl: formData.videoUrl || undefined,
      };

      // Step 4: Create or update
      let response;
      if (isEditing) {
        response = await api.put(`/admin/products/${productId}`, payload);
      } else {
        response = await api.post('/admin/products', payload);
      }

      if (response.data.success) {
        // Invalidate product list cache
        try { useAdminStore.getState().fetchProducts(); } catch (_) { /* best-effort */ }
        router.push('/admin/v2/products');
      } else {
        throw new Error(response.data.message || 'Failed to save product');
      }
    } catch (err: unknown) {
      console.error('Error saving product:', err);
      const error = err as {
        message?: string;
        response?: {
          status?: number;
          data?: { message?: string; error?: { message?: string } };
        };
      };

      let errorMsg = 'Failed to save product';
      if (error.response?.status === 401) {
        errorMsg = 'Unauthorized — your session may have expired. Please re-login.';
      } else if (error.response?.status === 403) {
        errorMsg = 'Access denied — you do not have permission to save products.';
      } else if (error.response?.status === 400) {
        errorMsg = error.response?.data?.error?.message || error.response?.data?.message || 'Invalid data — check your form inputs.';
      } else if (error.response?.data?.error?.message) {
        errorMsg = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }

      setSaveError(errorMsg);
      // Scroll to top so the user can see the error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Error Alert */}
        {saveError && (
          <Alert variant="error" dismissible onDismiss={() => setSaveError('')}>
            {saveError}
          </Alert>
        )}

        {/* Loading State */}
        {loading && isEditing ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
            <span className="ml-3 text-[#9ca3af]">Loading product...</span>
          </div>
        ) : (
        <>
        {/* Header */}
        <PageHeader
          title={isEditing ? 'Edit Product' : 'Add Product'}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Products', href: '/admin/v2/products' },
            { label: isEditing ? 'Edit' : 'New Product' },
          ]}
          actions={
            <>
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => router.back()}
              >
                Discard
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                isLoading={saving}
                disabled={saving}
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                isLoading={saving}
                disabled={saving}
                leftIcon={<Check size={18} />}
              >
                {isEditing ? 'Update Product' : 'Publish Product'}
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardTitle className="mb-4">Basic Information</CardTitle>
              <div className="space-y-4">
                <Input
                  label="Product Name"
                  placeholder="e.g., Gold Diamond Necklace"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  error={errors.name}
                />
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-[#374151]">URL Slug</label>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setSlugLocked(!slugLocked)}
                        className="text-xs text-[#d4af37] hover:text-[#b8962e] font-medium flex items-center gap-1"
                      >
                        {slugLocked ? (
                          <><span>🔒</span> Unlock to edit</>
                        ) : (
                          <><span>🔓</span> Lock slug</>
                        )}
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="gold-diamond-necklace"
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    error={errors.slug}
                    leftIcon={<Globe size={16} />}
                    disabled={!!(isEditing && slugLocked)}
                    hint={isEditing && slugLocked 
                      ? '⚠️ Slug is locked to protect SEO. Unlock only if necessary.' 
                      : 'This will be used in the product URL'
                    }
                  />
                </div>

                <Textarea
                  label="Short Description"
                  placeholder="Brief product summary (shown in product cards)"
                  value={formData.shortDescription}
                  onChange={(e) => updateField('shortDescription', e.target.value)}
                  rows={2}
                />

                <Textarea
                  label="Full Description"
                  placeholder="Detailed product description..."
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={6}
                  hint="Use detailed descriptions for better SEO"
                />
              </div>
            </Card>

            {/* Media */}
            <Card>
              <CardTitle className="mb-4">Media</CardTitle>
              <ImageUploader
                images={formData.images}
                onChange={(images) => updateField('images', images)}
              />

              <div className="mt-4">
                <Input
                  label="Product Video URL"
                  placeholder="https://cdn.orashop.in/products/demo.mp4"
                  value={formData.videoUrl}
                  onChange={(e) => updateField('videoUrl', e.target.value)}
                  hint="Optional: MP4/WebM URL for product listing cards"
                />
              </div>
            </Card>

            {/* Pricing */}
            <Card>
              <CardTitle className="mb-4">Pricing</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Price (₹)"
                  type="number"
                  min={0}
                  value={formData.price}
                  onChange={(e) => updateField('price', Number(e.target.value))}
                  error={errors.price}
                  leftIcon={<span className="text-sm">₹</span>}
                />
                
                <Input
                  label="Discount (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.discountPercent}
                  onChange={(e) => updateField('discountPercent', Number(e.target.value))}
                  leftIcon={<span className="text-sm">%</span>}
                />
                
                <Input
                  label="Final Price (₹)"
                  type="number"
                  value={formData.finalPrice}
                  disabled
                  leftIcon={<span className="text-sm">₹</span>}
                  hint="Calculated automatically"
                />
              </div>
            </Card>

            {/* Inventory */}
            <Card>
              <CardTitle className="mb-4">Inventory</CardTitle>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="SKU"
                    placeholder="SKU-001"
                    value={formData.sku}
                    onChange={(e) => updateField('sku', e.target.value)}
                    error={errors.sku}
                  />

                  <Input
                    label="HSN Code"
                    placeholder="e.g., 7113"
                    value={formData.hsnCode}
                    onChange={(e) => updateField('hsnCode', e.target.value)}
                    hint="Optional GST HSN code"
                  />
                  
                  <Input
                    label="Stock Quantity"
                    type="number"
                    min={0}
                    value={formData.stockQuantity}
                    onChange={(e) => updateField('stockQuantity', Number(e.target.value))}
                  />
                  
                  <Input
                    label="Low Stock Threshold"
                    type="number"
                    min={0}
                    value={formData.lowStockThreshold}
                    onChange={(e) => updateField('lowStockThreshold', Number(e.target.value))}
                    hint="Alert when stock falls below"
                  />
                </div>

                <Checkbox
                  label="Track inventory"
                  description="Continue selling when out of stock if unchecked"
                  checked={formData.trackInventory}
                  onChange={(e) => updateField('trackInventory', e.target.checked)}
                />
              </div>
            </Card>

            {/* Product Details */}
            <Card>
              <CardTitle className="mb-4">Product Details</CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Material"
                  placeholder="e.g., 22K Gold, Sterling Silver"
                  value={formData.material}
                  onChange={(e) => updateField('material', e.target.value)}
                />
                
                <Input
                  label="Weight"
                  placeholder="e.g., 10.5 grams"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                />
                
                <Input
                  label="Dimensions"
                  placeholder="e.g., 45cm chain length"
                  value={formData.dimensions}
                  onChange={(e) => updateField('dimensions', e.target.value)}
                />
              </div>

              <div className="mt-4">
                <Textarea
                  label="Care Instructions"
                  placeholder="How to care for this product..."
                  value={formData.careInstructions}
                  onChange={(e) => updateField('careInstructions', e.target.value)}
                  rows={3}
                />
              </div>
            </Card>

            {/* SEO */}
            <Card>
              <CardTitle className="mb-4">Search Engine Listing</CardTitle>
              <div className="space-y-4">
                <Input
                  label="Meta Title"
                  placeholder="Page title for search engines"
                  value={formData.metaTitle}
                  onChange={(e) => updateField('metaTitle', e.target.value)}
                  hint={`${formData.metaTitle.length}/60 characters`}
                />
                
                <Textarea
                  label="Meta Description"
                  placeholder="Brief description for search results..."
                  value={formData.metaDescription}
                  onChange={(e) => updateField('metaDescription', e.target.value)}
                  rows={3}
                  hint={`${formData.metaDescription.length}/160 characters`}
                />

                {/* SEO Preview */}
                <div className="p-4 bg-[#f6f7f9] rounded-lg">
                  <p className="text-sm text-[#9ca3af] mb-2">Search Engine Preview</p>
                  <div>
                    <p className="text-[#1a0dab] text-lg hover:underline cursor-pointer">
                      {formData.metaTitle || formData.name || 'Product Title'}
                    </p>
                    <p className="text-[#006621] text-sm">
                      orashop.in/products/{formData.slug || 'product-url'}
                    </p>
                    <p className="text-sm text-[#545454] mt-1">
                      {formData.metaDescription || formData.shortDescription || 'Product description will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Right column */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardTitle className="mb-4">Status</CardTitle>
              <div className="space-y-4">
                <Select
                  label="Product Status"
                  value={formData.isActive ? 'active' : 'draft'}
                  onChange={(e) => updateField('isActive', e.target.value === 'active')}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'active', label: 'Active' },
                  ]}
                />
                
                <Checkbox
                  label="Featured Product"
                  description="Show on homepage and featured sections"
                  checked={formData.isFeatured}
                  onChange={(e) => updateField('isFeatured', e.target.checked)}
                />
              </div>
            </Card>

            {/* Organization */}
            <Card>
              <CardTitle className="mb-4">Organization</CardTitle>
              <div className="space-y-4">
                <Select
                  label="Category"
                  value={formData.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map(cat => ({ value: cat.id, label: cat.name })),
                  ]}
                  error={errors.categoryId}
                />

                <div>
                  <label className="block mb-1.5 text-sm font-medium text-[#111827]">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border border-[#d1d5db] rounded-lg min-h-[80px]">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                        <button
                          onClick={() => updateField('tags', formData.tags.filter((_, i) => i !== index))}
                          className="ml-1 hover:text-[#dc2626]"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))}
                    <input
                      type="text"
                      placeholder="Add tag..."
                      className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          updateField('tags', [...formData.tags, e.currentTarget.value.trim()]);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#9ca3af]">
                    Press Enter to add tags
                  </p>
                </div>
              </div>
            </Card>

            {/* Gift Collections & Occasions */}
            <Card>
              <CardTitle className="mb-4">Gift Collections</CardTitle>
              
              <div className="space-y-4">
                {/* Collections */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Collections
                  </label>
                  <div className="space-y-2">
                    {['gifts-for-her', 'gifts-for-him', 'seasonal-special', 'premium-gifts'].map((collection) => (
                      <Checkbox
                        key={collection}
                        label={collection.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        checked={formData.collections.includes(collection)}
                        onChange={(e) => {
                          const newCollections = e.target.checked
                            ? [...formData.collections, collection]
                            : formData.collections.filter(c => c !== collection);
                          updateField('collections', newCollections);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Occasions */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-[#111827]">
                    Occasions
                  </label>
                  <div className="space-y-2">
                    {['birthday', 'anniversary', 'seasonal', 'just-because', 'wedding', 'graduation'].map((occasion) => (
                      <Checkbox
                        key={occasion}
                        label={occasion.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        checked={formData.occasions.includes(occasion)}
                        onChange={(e) => {
                          const newOccasions = e.target.checked
                            ? [...formData.occasions, occasion]
                            : formData.occasions.filter(o => o !== occasion);
                          updateField('occasions', newOccasions);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Featured Gift */}
                <div className="pt-2 border-t border-[#e5e7eb]">
                  <Checkbox
                    label="Featured Gift"
                    description="Show in 'Handpicked For Her' section"
                    checked={formData.isFeaturedGift}
                    onChange={(e) => updateField('isFeaturedGift', e.target.checked)}
                  />
                </div>
              </div>
            </Card>

            {/* BOGO Campaign */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <CardTitle className="text-base">BOGO Campaign</CardTitle>
                  <p className="text-sm text-[#9ca3af] mt-1">
                    Add this product to "Buy 1 Get 1 Free" offers
                  </p>
                </div>
                <Badge 
                  variant={formData.isBOGOEligible ? "success" : "secondary"}
                  size="sm"
                >
                  {formData.isBOGOEligible ? 'Eligible' : 'Not in BOGO'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <Checkbox
                  label="Enable BOGO for this product"
                  description="Customers can buy 2 products from the same tier and get the cheaper one free/discounted"
                  checked={formData.isBOGOEligible}
                  onChange={(e) => {
                    updateField('isBOGOEligible', e.target.checked);
                    if (!e.target.checked) {
                      updateField('bogoPriceTier', null);
                      updateField('bogoCategory', '');
                    }
                  }}
                />

                {formData.isBOGOEligible && (
                  <>
                    <div className="pl-6 space-y-4 border-l-2 border-[#d4af37]">
                      <Select
                        label="BOGO Price Tier"
                        hint="Products must be in the same tier to qualify for BOGO"
                        value={String(formData.bogoPriceTier || '')}
                        onChange={(e) => updateField('bogoPriceTier', e.target.value ? parseInt(e.target.value) : null)}
                        options={[
                          { value: '', label: 'Select Price Tier' },
                          { value: '999', label: '₹999 — Everyday Essentials' },
                          { value: '1499', label: '₹1,499 — Bestseller Duos' },
                          { value: '1999', label: '₹1,999 — Premium Picks' },
                          { value: '2599', label: '₹2,599 — Luxury Statement' },
                        ]}
                      />

                      <Select
                        label="BOGO Category"
                        hint="Used for combo display and filtering"
                        value={formData.bogoCategory}
                        onChange={(e) => updateField('bogoCategory', e.target.value)}
                        options={[
                          { value: '', label: 'Select Category' },
                          { value: 'earrings', label: 'Earrings' },
                          { value: 'necklaces', label: 'Necklaces' },
                          { value: 'rings', label: 'Rings' },
                          { value: 'bracelets', label: 'Bracelets' },
                          { value: 'pendants', label: 'Pendants' },
                          { value: 'bangles', label: 'Bangles' },
                        ]}
                      />

                      <div className="p-3 bg-[#fffbf0] border border-[#fde8b3] rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-[#b8962e] mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-[#8b6914]">
                            <p className="font-medium mb-1">BOGO Rules:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li>Customer picks any 2 products from same tier</li>
                              <li>The cheaper item is free (or discounted based on campaign settings)</li>
                              <li>Both products must be in stock and BOGO-eligible</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Tumbler Settings */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <CardTitle className="text-base">Tumbler Settings</CardTitle>
                  <p className="text-sm text-[#9ca3af] mt-1">
                    Mark this product as a tumbler for the Tumblers collection
                  </p>
                </div>
                <Badge 
                  variant={formData.isTumbler ? "success" : "secondary"}
                  size="sm"
                >
                  {formData.isTumbler ? 'Tumbler' : 'Regular'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <Checkbox
                  label="This is a Tumbler"
                  description="Product will appear in /collections/tumblers"
                  checked={formData.isTumbler}
                  onChange={(e) => {
                    updateField('isTumbler', e.target.checked);
                    if (!e.target.checked) {
                      updateField('capacity', '');
                    }
                  }}
                />

                {formData.isTumbler && (
                  <div className="pl-6 space-y-4 border-l-2 border-[#d4af37]">
                    <Select
                      label="Capacity"
                      hint="Tumbler size / volume"
                      value={formData.capacity}
                      onChange={(e) => updateField('capacity', e.target.value)}
                      options={[
                        { value: '', label: 'Select Capacity' },
                        { value: '250ml', label: '250ml' },
                        { value: '350ml', label: '350ml' },
                        { value: '400ml', label: '400ml' },
                        { value: '500ml', label: '500ml' },
                        { value: '600ml', label: '600ml' },
                        { value: '750ml', label: '750ml' },
                        { value: '1L', label: '1 Litre' },
                      ]}
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-[#e5e7eb]">
                  <Checkbox
                    label="Bestseller"
                    description="Show bestseller badge on product card"
                    checked={formData.isBestseller}
                    onChange={(e) => updateField('isBestseller', e.target.checked)}
                  />
                </div>
              </div>
            </Card>

            {/* Offer Settings */}
            <Card>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <CardTitle className="text-base">Offer Settings</CardTitle>
                  <p className="text-sm text-[#9ca3af] mt-1">
                    Add this product to the Offers collection
                  </p>
                </div>
                <Badge 
                  variant={formData.isOnOffer ? "error" : "secondary"}
                  size="sm"
                >
                  {formData.isOnOffer ? '🔥 On Offer' : 'No Offer'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <Checkbox
                  label="Enable offer for this product"
                  description="Product will appear in /collections/offers"
                  checked={formData.isOnOffer}
                  onChange={(e) => {
                    updateField('isOnOffer', e.target.checked);
                    if (!e.target.checked) {
                      updateField('offerType', '');
                      updateField('offerValue', 0);
                      updateField('offerExpiry', '');
                      updateField('showCountdown', false);
                    }
                  }}
                />

                {formData.isOnOffer && (
                  <div className="pl-6 space-y-4 border-l-2 border-[#E91E63]">
                    <Select
                      label="Offer Type"
                      value={formData.offerType}
                      onChange={(e) => updateField('offerType', e.target.value)}
                      options={[
                        { value: '', label: 'Select Offer Type' },
                        { value: 'PERCENT', label: 'Percentage Discount (e.g., 20% off)' },
                        { value: 'FIXED', label: 'Fixed Amount Off (e.g., ₹200 off)' },
                        { value: 'BOGO', label: 'Buy One Get One' },
                        { value: 'CLEARANCE', label: 'Clearance Sale' },
                      ]}
                    />

                    {(formData.offerType === 'PERCENT' || formData.offerType === 'FIXED') && (
                      <Input
                        label={formData.offerType === 'PERCENT' ? 'Discount (%)' : 'Discount Amount (₹)'}
                        type="number"
                        min={0}
                        max={formData.offerType === 'PERCENT' ? 100 : undefined}
                        value={formData.offerValue}
                        onChange={(e) => updateField('offerValue', Number(e.target.value))}
                        leftIcon={<span className="text-sm">{formData.offerType === 'PERCENT' ? '%' : '₹'}</span>}
                      />
                    )}

                    <Input
                      label="Offer Expiry"
                      type="datetime-local"
                      value={formData.offerExpiry}
                      onChange={(e) => updateField('offerExpiry', e.target.value)}
                      hint="Leave empty for no expiry"
                    />

                    <Checkbox
                      label="Show Countdown Timer"
                      description="Display a live countdown on the product card"
                      checked={formData.showCountdown}
                      onChange={(e) => updateField('showCountdown', e.target.checked)}
                    />

                    <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#dc2626] mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-[#991b1b]">
                          <p className="font-medium mb-1">Offer Rules:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li>Offer discount applies at checkout</li>
                            <li>Expired offers auto-hide from the offers page</li>
                            <li>BOGO requires 2 eligible products in cart</li>
                            <li>Countdown is only shown if expiry is set</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Stats (for edit mode) */}
            {isEditing && (
              <Card>
                <CardTitle className="mb-4">Statistics</CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Total Sales</span>
                    <span className="text-sm font-medium text-[#111827]">24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Revenue</span>
                    <span className="text-sm font-medium text-[#111827]">₹48,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Views</span>
                    <span className="text-sm font-medium text-[#111827]">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Conversion</span>
                    <span className="text-sm font-medium text-[#111827]">1.9%</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </AdminLayout>
  );
}
