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
  tags: string[];
  material: string;
  weight: string;
  dimensions: string;
  careInstructions: string;
  
  // Status
  isActive: boolean;
  isFeatured: boolean;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  
  // Images
  images: ProductImage[];
  
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    const newImages: ProductImage[] = files.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0,
      file,
    }));
    
    onChange([...images, ...newImages]);
  }, [images, onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
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
            Drop images here or click to upload
          </p>
          <p className="text-xs text-[#9ca3af]">
            PNG, JPG, WEBP up to 5MB each
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
    tags: [],
    material: '',
    weight: '',
    dimensions: '',
    careInstructions: '',
    isActive: false,
    isFeatured: false,
    metaTitle: '',
    metaDescription: '',
    images: [],
    variants: [],
    hasVariants: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Calculate final price when price or discount changes
  useEffect(() => {
    const discountAmount = formData.price * (formData.discountPercent / 100);
    const finalPrice = formData.price - discountAmount;
    setFormData(prev => ({ ...prev, finalPrice: Math.round(finalPrice) }));
  }, [formData.price, formData.discountPercent]);

  // Auto-generate slug from name
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
    if (!formData.sku.trim()) {
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
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        isActive: publish ? true : formData.isActive,
      };

      // TODO: API call to save product
      console.log('Saving product:', payload);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      router.push('/admin/v2/products');
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
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
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                isLoading={saving}
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
                
                <Input
                  label="URL Slug"
                  placeholder="gold-diamond-necklace"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  error={errors.slug}
                  leftIcon={<Globe size={16} />}
                  hint="This will be used in the product URL"
                />

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
                    { value: 'necklaces', label: 'Necklaces' },
                    { value: 'earrings', label: 'Earrings' },
                    { value: 'rings', label: 'Rings' },
                    { value: 'bracelets', label: 'Bracelets' },
                    { value: 'bangles', label: 'Bangles' },
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
      </div>
    </AdminLayout>
  );
}
