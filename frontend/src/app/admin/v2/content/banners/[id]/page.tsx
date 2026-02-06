'use client';

/**
 * ORA Admin Panel - Banner Editor
 * ================================
 * 
 * Create and edit banners with image upload,
 * scheduling, and device-specific variants
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import { PageHeader, Button, Card, Input, Select, Textarea, Checkbox, Spinner, Alert, Badge } from '../../../components/ui';
import {
  ArrowLeft,
  Save,
  Upload,
  Image,
  Monitor,
  Smartphone,
  Trash2,
  Link as LinkIcon,
  Calendar,
  Eye,
  EyeOff,
  ExternalLink,
  Layers,
  Settings,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface BannerForm {
  title: string;
  type: 'hero' | 'promotional' | 'category' | 'announcement';
  description: string;
  imageDesktop: string;
  imageMobile: string;
  altText: string;
  linkUrl: string;
  linkText: string;
  openInNewTab: boolean;
  position: number;
  isActive: boolean;
  hasSchedule: boolean;
  startDate: string;
  endDate: string;
  overlayColor: string;
  overlayOpacity: number;
  textPosition: 'left' | 'center' | 'right';
  textColor: string;
}

// ============================================
// IMAGE UPLOADER
// ============================================

const ImageUploader = ({
  label,
  value,
  onChange,
  aspect,
  icon: Icon,
  recommended,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect: string;
  icon: React.ElementType;
  recommended: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // TODO: Handle file upload
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Handle file upload
      // For now, create a mock URL
      onChange(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--admin-text-primary)]">{label}</label>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-xs text-[var(--admin-error-600)] hover:text-[var(--admin-error-700)]"
          >
            Remove
          </button>
        )}
      </div>
      
      {value ? (
        <div className={`relative rounded-lg overflow-hidden bg-[var(--admin-bg-secondary)] ${aspect}`}>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`${aspect} border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            isDragging
              ? 'border-[var(--admin-primary-500)] bg-[var(--admin-primary-50)]'
              : 'border-[var(--admin-border)] hover:border-[var(--admin-primary-300)] bg-[var(--admin-bg-secondary)]'
          }`}
        >
          <Icon size={32} className="text-[var(--admin-text-muted)]" />
          <p className="text-sm text-[var(--admin-text-muted)]">Click or drag to upload</p>
          <p className="text-xs text-[var(--admin-text-muted)]">Recommended: {recommended}</p>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

// ============================================
// BANNER PREVIEW
// ============================================

const BannerPreview = ({ form }: { form: BannerForm }) => {
  return (
    <div className="relative rounded-lg overflow-hidden bg-[var(--admin-bg-secondary)] aspect-[21/9]">
      {form.imageDesktop ? (
        <img
          src={form.imageDesktop}
          alt={form.altText || form.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Image size={48} className="text-[var(--admin-text-muted)]" />
        </div>
      )}
      
      {/* Overlay */}
      {form.overlayColor && form.overlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: form.overlayColor,
            opacity: form.overlayOpacity / 100,
          }}
        />
      )}
      
      {/* Text content */}
      {(form.title || form.linkText) && (
        <div
          className={`absolute inset-0 flex flex-col gap-2 p-8 ${
            form.textPosition === 'left' ? 'items-start' : form.textPosition === 'right' ? 'items-end' : 'items-center'
          } justify-center`}
        >
          {form.title && (
            <h2
              className="text-2xl font-bold"
              style={{ color: form.textColor }}
            >
              {form.title}
            </h2>
          )}
          {form.linkText && (
            <span
              className="px-4 py-2 rounded-lg font-medium"
              style={{
                backgroundColor: form.textColor,
                color: form.overlayColor || '#000',
              }}
            >
              {form.linkText}
            </span>
          )}
        </div>
      )}
      
      {/* Status badge */}
      {!form.isActive && (
        <div className="absolute top-4 right-4">
          <Badge variant="secondary">
            <EyeOff size={12} className="mr-1" />
            Hidden
          </Badge>
        </div>
      )}
    </div>
  );
};

// ============================================
// BANNER FORM PAGE
// ============================================

export default function BannerFormPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bannerId = params.id as string;
  const isEditMode = bannerId && bannerId !== 'new';
  const defaultType = (searchParams.get('type') as any) || 'hero';

  // Form state
  const [form, setForm] = useState<BannerForm>({
    title: '',
    type: defaultType,
    description: '',
    imageDesktop: '',
    imageMobile: '',
    altText: '',
    linkUrl: '',
    linkText: '',
    openInNewTab: false,
    position: 1,
    isActive: true,
    hasSchedule: false,
    startDate: '',
    endDate: '',
    overlayColor: '#000000',
    overlayOpacity: 0,
    textPosition: 'center',
    textColor: '#FFFFFF',
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BannerForm, string>>>({});
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Fetch banner if editing
  useEffect(() => {
    if (isEditMode) {
      const fetchBanner = async () => {
        setLoading(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mock data
          setForm({
            title: 'Summer Collection 2024',
            type: 'hero',
            description: 'Showcase the new summer jewelry collection',
            imageDesktop: '/api/placeholder/1920/600',
            imageMobile: '/api/placeholder/640/800',
            altText: 'Summer Collection 2024 Banner',
            linkUrl: '/collections/summer-2024',
            linkText: 'Shop Now',
            openInNewTab: false,
            position: 1,
            isActive: true,
            hasSchedule: true,
            startDate: '2024-06-01',
            endDate: '2024-06-30',
            overlayColor: '#000000',
            overlayOpacity: 20,
            textPosition: 'center',
            textColor: '#FFFFFF',
          });
        } catch (error) {
          console.error('Error fetching banner:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchBanner();
    }
  }, [isEditMode, bannerId]);

  // Update form field
  const updateForm = (field: keyof BannerForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Partial<Record<keyof BannerForm, string>> = {};

    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.imageDesktop) newErrors.imageDesktop = 'Desktop image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/admin/v2/content');
    } catch (error) {
      console.error('Error saving banner:', error);
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = {
    hero: { label: 'Hero Slider', description: 'Full-width banner for homepage slider' },
    promotional: { label: 'Promotional', description: 'Promotional banner for sales and offers' },
    category: { label: 'Category', description: 'Banner for category pages' },
    announcement: { label: 'Announcement', description: 'Small announcement banner' },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title={isEditMode ? 'Edit Banner' : 'Create Banner'}
          description={typeConfig[form.type].description}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Content', href: '/admin/v2/content' },
            { label: isEditMode ? 'Edit Banner' : 'New Banner' },
          ]}
          actions={
            <>
              <Button variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                leftIcon={<Save size={18} />}
                onClick={handleSubmit}
                isLoading={saving}
              >
                {isEditMode ? 'Save Changes' : 'Create Banner'}
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Details */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Banner Details</h3>
              <div className="space-y-4">
                <Input
                  label="Banner Title"
                  placeholder="e.g., Summer Collection 2024"
                  value={form.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                  error={errors.title}
                  required
                />
                <Select
                  label="Banner Type"
                  value={form.type}
                  onChange={(e) => updateForm('type', e.target.value)}
                  options={[
                    { value: 'hero', label: 'Hero Slider' },
                    { value: 'promotional', label: 'Promotional' },
                    { value: 'category', label: 'Category' },
                  ]}
                />
                <Textarea
                  label="Description (Internal)"
                  placeholder="Add notes about this banner..."
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={2}
                />
              </div>
            </Card>

            {/* Images */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploader
                  label="Desktop Image"
                  value={form.imageDesktop}
                  onChange={(url) => updateForm('imageDesktop', url)}
                  aspect="aspect-[16/9]"
                  icon={Monitor}
                  recommended="1920 × 600px"
                />
                <ImageUploader
                  label="Mobile Image (Optional)"
                  value={form.imageMobile}
                  onChange={(url) => updateForm('imageMobile', url)}
                  aspect="aspect-[9/16]"
                  icon={Smartphone}
                  recommended="640 × 800px"
                />
              </div>
              <Input
                label="Alt Text"
                placeholder="Describe the image for accessibility"
                value={form.altText}
                onChange={(e) => updateForm('altText', e.target.value)}
                className="mt-4"
                hint="Important for SEO and screen readers"
              />
            </Card>

            {/* Link */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Link</h3>
              <div className="space-y-4">
                <Input
                  label="Link URL"
                  placeholder="/collections/summer or https://..."
                  value={form.linkUrl}
                  onChange={(e) => updateForm('linkUrl', e.target.value)}
                  leftIcon={<LinkIcon size={16} />}
                />
                <Input
                  label="Button Text"
                  placeholder="e.g., Shop Now"
                  value={form.linkText}
                  onChange={(e) => updateForm('linkText', e.target.value)}
                />
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.openInNewTab}
                    onChange={(checked) => updateForm('openInNewTab', checked)}
                  />
                  <span className="text-sm text-[var(--admin-text-primary)]">Open in new tab</span>
                </label>
              </div>
            </Card>

            {/* Style Options */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Style Options</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--admin-text-primary)] mb-2 block">
                      Overlay Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.overlayColor}
                        onChange={(e) => updateForm('overlayColor', e.target.value)}
                        className="w-10 h-10 rounded border border-[var(--admin-border)] cursor-pointer"
                      />
                      <Input
                        value={form.overlayColor}
                        onChange={(e) => updateForm('overlayColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <Input
                    label="Overlay Opacity"
                    type="range"
                    min="0"
                    max="100"
                    value={form.overlayOpacity}
                    onChange={(e) => updateForm('overlayOpacity', parseInt(e.target.value))}
                    hint={`${form.overlayOpacity}%`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Text Position"
                    value={form.textPosition}
                    onChange={(e) => updateForm('textPosition', e.target.value)}
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'center', label: 'Center' },
                      { value: 'right', label: 'Right' },
                    ]}
                  />
                  <div>
                    <label className="text-sm font-medium text-[var(--admin-text-primary)] mb-2 block">
                      Text Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.textColor}
                        onChange={(e) => updateForm('textColor', e.target.value)}
                        className="w-10 h-10 rounded border border-[var(--admin-border)] cursor-pointer"
                      />
                      <Input
                        value={form.textColor}
                        onChange={(e) => updateForm('textColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[var(--admin-text-primary)]">Preview</h3>
                <div className="flex items-center gap-1 bg-[var(--admin-bg-secondary)] rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Monitor size={16} className={previewDevice === 'desktop' ? 'text-[var(--admin-primary-600)]' : 'text-[var(--admin-text-muted)]'} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                  >
                    <Smartphone size={16} className={previewDevice === 'mobile' ? 'text-[var(--admin-primary-600)]' : 'text-[var(--admin-text-muted)]'} />
                  </button>
                </div>
              </div>
              <BannerPreview form={form} />
            </Card>

            {/* Status */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Status</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-[var(--admin-bg-secondary)] rounded-lg cursor-pointer">
                  <div className="flex items-center gap-3">
                    {form.isActive ? (
                      <Eye size={20} className="text-[var(--admin-success-600)]" />
                    ) : (
                      <EyeOff size={20} className="text-[var(--admin-text-muted)]" />
                    )}
                    <span className="font-medium text-[var(--admin-text-primary)]">
                      {form.isActive ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <Checkbox
                    checked={form.isActive}
                    onChange={(checked) => updateForm('isActive', checked)}
                  />
                </label>

                <Input
                  label="Position"
                  type="number"
                  min="1"
                  value={form.position}
                  onChange={(e) => updateForm('position', parseInt(e.target.value))}
                  hint="Order in which the banner appears"
                />
              </div>
            </Card>

            {/* Schedule */}
            <Card>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Schedule</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={form.hasSchedule}
                    onChange={(checked) => updateForm('hasSchedule', checked)}
                  />
                  <span className="text-sm text-[var(--admin-text-primary)]">Set schedule</span>
                </label>

                {form.hasSchedule && (
                  <>
                    <Input
                      label="Start Date"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => updateForm('startDate', e.target.value)}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => updateForm('endDate', e.target.value)}
                    />
                  </>
                )}
              </div>
            </Card>

            {/* Delete */}
            {isEditMode && (
              <Card className="border-[var(--admin-error-200)]">
                <h3 className="font-semibold text-[var(--admin-error-600)] mb-2">Danger Zone</h3>
                <p className="text-sm text-[var(--admin-text-muted)] mb-4">
                  Permanently delete this banner. This action cannot be undone.
                </p>
                <Button
                  variant="ghost"
                  leftIcon={<Trash2 size={16} />}
                  className="text-[var(--admin-error-600)] w-full"
                >
                  Delete Banner
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
