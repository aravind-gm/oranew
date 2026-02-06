'use client';

/**
 * ORA Admin Panel - Create/Edit Discount Page
 * ============================================
 * 
 * Comprehensive discount creation with scheduling,
 * conditions, and usage limits
 */

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import { PageHeader, Button, Card, Input, Select, Textarea, Checkbox, Badge, Spinner, Alert } from '../../../components/ui';
import {
  ArrowLeft,
  Save,
  Percent,
  Tag,
  Gift,
  Zap,
  Calendar,
  Users,
  ShoppingBag,
  Package,
  Clock,
  AlertCircle,
  CheckCircle,
  Trash2,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface DiscountForm {
  name: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'free_shipping';
  value: string;
  appliesTo: 'all' | 'collection' | 'product' | 'customer';
  collectionIds: string[];
  productIds: string[];
  customerSegments: string[];
  minPurchase: string;
  minQuantity: string;
  maxUses: string;
  usesPerCustomer: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  hasEndDate: boolean;
  isActive: boolean;
  combineWithOther: boolean;
  excludeSaleItems: boolean;
}

// ============================================
// DISCOUNT FORM PAGE
// ============================================

export default function DiscountFormPage() {
  const params = useParams();
  const router = useRouter();
  const discountId = params.id as string;
  const isEditMode = discountId && discountId !== 'new';

  // Form state
  const [form, setForm] = useState<DiscountForm>({
    name: '',
    code: '',
    description: '',
    type: 'percentage',
    value: '',
    appliesTo: 'all',
    collectionIds: [],
    productIds: [],
    customerSegments: [],
    minPurchase: '',
    minQuantity: '',
    maxUses: '',
    usesPerCustomer: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '00:00',
    endDate: '',
    endTime: '23:59',
    hasEndDate: false,
    isActive: true,
    combineWithOther: false,
    excludeSaleItems: true,
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof DiscountForm, string>>>({});

  // Fetch discount if editing
  useEffect(() => {
    if (isEditMode) {
      const fetchDiscount = async () => {
        setLoading(true);
        try {
          // TODO: API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mock data
          setForm({
            name: 'Summer Sale 2024',
            code: '',
            description: 'Summer collection sale with 20% off on all items',
            type: 'percentage',
            value: '20',
            appliesTo: 'all',
            collectionIds: [],
            productIds: [],
            customerSegments: [],
            minPurchase: '2000',
            minQuantity: '',
            maxUses: '',
            usesPerCustomer: '',
            startDate: '2024-06-01',
            startTime: '00:00',
            endDate: '2024-06-30',
            endTime: '23:59',
            hasEndDate: true,
            isActive: true,
            combineWithOther: false,
            excludeSaleItems: true,
          });
        } catch (error) {
          console.error('Error fetching discount:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchDiscount();
    }
  }, [isEditMode, discountId]);

  // Update form field
  const updateForm = (field: keyof DiscountForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Generate random code
  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateForm('code', code);
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Partial<Record<keyof DiscountForm, string>> = {};

    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (form.type !== 'free_shipping' && !form.value) {
      newErrors.value = 'Value is required';
    }
    if (form.type === 'percentage' && Number(form.value) > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }
    if (!form.startDate) newErrors.startDate = 'Start date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // TODO: API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/admin/v2/marketing/discounts');
    } catch (error) {
      console.error('Error saving discount:', error);
    } finally {
      setSaving(false);
    }
  };

  // Type options
  const typeOptions = [
    { value: 'percentage', label: 'Percentage off', icon: Percent, description: 'e.g., 10% off' },
    { value: 'fixed', label: 'Fixed amount off', icon: Tag, description: 'e.g., ₹500 off' },
    { value: 'free_shipping', label: 'Free shipping', icon: Zap, description: 'Free delivery' },
    { value: 'buy_x_get_y', label: 'Buy X Get Y', icon: Gift, description: 'e.g., Buy 2 Get 1' },
  ];

  // Applies to options
  const appliesToOptions = [
    { value: 'all', label: 'All products', icon: Package },
    { value: 'collection', label: 'Specific collections', icon: ShoppingBag },
    { value: 'product', label: 'Specific products', icon: Package },
    { value: 'customer', label: 'Customer segments', icon: Users },
  ];

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
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={isEditMode ? 'Edit Discount' : 'Create Discount'}
          description={isEditMode ? 'Modify discount settings' : 'Set up a new discount or promotion'}
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Marketing', href: '/admin/v2/marketing' },
            { label: 'Discounts', href: '/admin/v2/marketing/discounts' },
            { label: isEditMode ? 'Edit' : 'Create' },
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
                {isEditMode ? 'Save Changes' : 'Create Discount'}
              </Button>
            </>
          }
        />

        {/* Discount Type Selection */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Discount Type</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {typeOptions.map((option) => {
              const isSelected = form.type === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => updateForm('type', option.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[var(--admin-primary-500)] bg-[var(--admin-primary-50)]'
                      : 'border-[var(--admin-border)] hover:border-[var(--admin-primary-200)]'
                  }`}
                >
                  <option.icon
                    size={24}
                    className={isSelected ? 'text-[var(--admin-primary-600)]' : 'text-[var(--admin-text-muted)]'}
                  />
                  <p className={`font-medium mt-2 ${isSelected ? 'text-[var(--admin-primary-600)]' : 'text-[var(--admin-text-primary)]'}`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-[var(--admin-text-muted)] mt-1">{option.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Basic Details */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Details</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Discount Name"
                placeholder="e.g., Summer Sale 2024"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                error={errors.name}
                required
              />
              <div>
                <Input
                  label="Discount Code (Optional)"
                  placeholder="e.g., SUMMER20"
                  value={form.code}
                  onChange={(e) => updateForm('code', e.target.value.toUpperCase())}
                  hint="Leave empty for automatic discounts"
                />
                <button
                  onClick={generateCode}
                  className="text-sm text-[var(--admin-primary-600)] hover:text-[var(--admin-primary-700)] mt-1"
                >
                  Generate random code
                </button>
              </div>
            </div>

            {form.type === 'percentage' && (
              <Input
                label="Percentage Off"
                placeholder="e.g., 20"
                value={form.value}
                onChange={(e) => updateForm('value', e.target.value)}
                error={errors.value}
                rightIcon={<Percent size={16} />}
                type="number"
                min="1"
                max="100"
                required
              />
            )}

            {form.type === 'fixed' && (
              <Input
                label="Amount Off"
                placeholder="e.g., 500"
                value={form.value}
                onChange={(e) => updateForm('value', e.target.value)}
                error={errors.value}
                leftIcon={<span className="text-sm">₹</span>}
                type="number"
                min="1"
                required
              />
            )}

            <Textarea
              label="Description (Internal)"
              placeholder="Add notes about this discount..."
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              rows={2}
            />
          </div>
        </Card>

        {/* Applies To */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Applies To</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {appliesToOptions.map((option) => {
              const isSelected = form.appliesTo === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => updateForm('appliesTo', option.value)}
                  className={`p-3 rounded-lg border-2 flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'border-[var(--admin-primary-500)] bg-[var(--admin-primary-50)]'
                      : 'border-[var(--admin-border)] hover:border-[var(--admin-primary-200)]'
                  }`}
                >
                  <option.icon
                    size={20}
                    className={isSelected ? 'text-[var(--admin-primary-600)]' : 'text-[var(--admin-text-muted)]'}
                  />
                  <span className={`text-sm font-medium ${isSelected ? 'text-[var(--admin-primary-600)]' : 'text-[var(--admin-text-primary)]'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {form.appliesTo === 'collection' && (
            <div className="p-4 bg-[var(--admin-bg-secondary)] rounded-lg">
              <p className="text-sm text-[var(--admin-text-muted)] mb-2">Select collections</p>
              {/* TODO: Collection selector component */}
              <Button variant="secondary" size="sm">Browse Collections</Button>
            </div>
          )}

          {form.appliesTo === 'product' && (
            <div className="p-4 bg-[var(--admin-bg-secondary)] rounded-lg">
              <p className="text-sm text-[var(--admin-text-muted)] mb-2">Select products</p>
              {/* TODO: Product selector component */}
              <Button variant="secondary" size="sm">Browse Products</Button>
            </div>
          )}

          {form.appliesTo === 'customer' && (
            <div className="p-4 bg-[var(--admin-bg-secondary)] rounded-lg">
              <p className="text-sm text-[var(--admin-text-muted)] mb-2">Select customer segments</p>
              <div className="flex flex-wrap gap-2">
                {['VIP', 'Repeat Buyer', 'New Customer', 'High Value'].map((segment) => (
                  <label key={segment} className="flex items-center gap-2">
                    <Checkbox
                      checked={form.customerSegments.includes(segment)}
                      onChange={(checked) => {
                        if (checked) {
                          updateForm('customerSegments', [...form.customerSegments, segment]);
                        } else {
                          updateForm('customerSegments', form.customerSegments.filter(s => s !== segment));
                        }
                      }}
                    />
                    <span className="text-sm">{segment}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Conditions */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Conditions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Minimum Purchase Amount"
              placeholder="e.g., 2000"
              value={form.minPurchase}
              onChange={(e) => updateForm('minPurchase', e.target.value)}
              leftIcon={<span className="text-sm">₹</span>}
              type="number"
              hint="Leave empty for no minimum"
            />
            <Input
              label="Minimum Quantity"
              placeholder="e.g., 2"
              value={form.minQuantity}
              onChange={(e) => updateForm('minQuantity', e.target.value)}
              type="number"
              hint="Leave empty for no minimum"
            />
          </div>
        </Card>

        {/* Usage Limits */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Usage Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Total Usage Limit"
              placeholder="e.g., 100"
              value={form.maxUses}
              onChange={(e) => updateForm('maxUses', e.target.value)}
              type="number"
              hint="Leave empty for unlimited uses"
            />
            <Input
              label="Uses Per Customer"
              placeholder="e.g., 1"
              value={form.usesPerCustomer}
              onChange={(e) => updateForm('usesPerCustomer', e.target.value)}
              type="number"
              hint="Leave empty for unlimited"
            />
          </div>
        </Card>

        {/* Schedule */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Schedule</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => updateForm('startDate', e.target.value)}
                error={errors.startDate}
                required
              />
              <Input
                label="Start Time"
                type="time"
                value={form.startTime}
                onChange={(e) => updateForm('startTime', e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2">
              <Checkbox
                checked={form.hasEndDate}
                onChange={(checked) => updateForm('hasEndDate', checked)}
              />
              <span className="text-sm text-[var(--admin-text-primary)]">Set end date</span>
            </label>

            {form.hasEndDate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="End Date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateForm('endDate', e.target.value)}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => updateForm('endTime', e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>

        {/* Additional Options */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4">Additional Options</h3>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--admin-bg-secondary)] cursor-pointer">
              <Checkbox
                checked={form.combineWithOther}
                onChange={(checked) => updateForm('combineWithOther', checked)}
              />
              <div>
                <p className="text-sm font-medium text-[var(--admin-text-primary)]">
                  Combine with other discounts
                </p>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  Allow this discount to be used with other active discounts
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--admin-bg-secondary)] cursor-pointer">
              <Checkbox
                checked={form.excludeSaleItems}
                onChange={(checked) => updateForm('excludeSaleItems', checked)}
              />
              <div>
                <p className="text-sm font-medium text-[var(--admin-text-primary)]">
                  Exclude sale items
                </p>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  Don't apply this discount to items already on sale
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Preview */}
        <Card className="bg-[var(--admin-primary-50)] border-[var(--admin-primary-200)]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Percent size={24} className="text-[var(--admin-primary-600)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-1">Discount Preview</h3>
              <p className="text-sm text-[var(--admin-text-secondary)]">
                {form.name || 'Unnamed discount'}
                {form.code && ` (Code: ${form.code})`}
                {' - '}
                {form.type === 'percentage' && `${form.value || '0'}% off`}
                {form.type === 'fixed' && `₹${form.value || '0'} off`}
                {form.type === 'free_shipping' && 'Free shipping'}
                {form.type === 'buy_x_get_y' && 'Buy X Get Y'}
                {' on '}
                {form.appliesTo === 'all' && 'all products'}
                {form.appliesTo === 'collection' && 'specific collections'}
                {form.appliesTo === 'product' && 'specific products'}
                {form.appliesTo === 'customer' && 'selected customer segments'}
                {form.minPurchase && ` (min ₹${form.minPurchase})`}
              </p>
              <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                Starts {form.startDate || 'immediately'}
                {form.hasEndDate && form.endDate && ` · Ends ${form.endDate}`}
              </p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-[var(--admin-border)] pt-6">
          {isEditMode && (
            <Button variant="ghost" leftIcon={<Trash2 size={18} />} className="text-[var(--admin-error-600)]">
              Delete Discount
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              leftIcon={<Save size={18} />}
              onClick={handleSubmit}
              isLoading={saving}
            >
              {isEditMode ? 'Save Changes' : 'Create Discount'}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
