'use client';

/**
 * ORA Admin Panel - Store Settings
 * =================================
 * 
 * Core store configuration including business info,
 * contact details, and operational settings
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, Input, Select, Textarea, Checkbox, Spinner, Alert } from '../../components/ui';
import {
  Store,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  Upload,
  Image,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface StoreSettings {
  // Business Info
  storeName: string;
  legalName: string;
  gstNumber: string;
  panNumber: string;
  email: string;
  phone: string;
  website: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  
  // Branding
  logo: string;
  favicon: string;
  
  // Operational
  currency: string;
  timezone: string;
  orderPrefix: string;
  enableMaintenance: boolean;
  maintenanceMessage: string;
}

// ============================================
// STORE SETTINGS PAGE
// ============================================

export default function StoreSettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'ORA Jewellery',
    legalName: 'ORA Jewellery Pvt Ltd',
    gstNumber: '27AABCO1234A1Z5',
    panNumber: 'AABCO1234A',
    email: 'hello@orajewellery.com',
    phone: '9842253984',
    website: 'https://orajewellery.com',
    address: '123 MG Road, Bandra West',
    city: 'Tiruppur',
    state: 'Maharashtra',
    pincode: '400050',
    country: 'India',
    logo: '',
    favicon: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    orderPrefix: 'ORA',
    enableMaintenance: false,
    maintenanceMessage: 'We are currently updating our store. Please check back soon!',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update setting
  const updateSetting = (key: keyof StoreSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setHasChanges(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Page Header */}
        <PageHeader
          title="Store Settings"
          description="Configure your store's basic information"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Settings', href: '/admin/v2/settings' },
            { label: 'Store Details' },
          ]}
          actions={
            <Button
              leftIcon={<Save size={18} />}
              onClick={handleSave}
              isLoading={saving}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          }
        />

        {/* Unsaved Changes Alert */}
        {hasChanges && (
          <Alert variant="warning">
            You have unsaved changes. Don't forget to save before leaving this page.
          </Alert>
        )}

        {/* Business Information */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4 flex items-center gap-2">
            <Store size={20} />
            Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Store Name"
              value={settings.storeName}
              onChange={(e) => updateSetting('storeName', e.target.value)}
              placeholder="Your store name"
              required
            />
            <Input
              label="Legal Business Name"
              value={settings.legalName}
              onChange={(e) => updateSetting('legalName', e.target.value)}
              placeholder="Registered business name"
            />
            <Input
              label="GST Number"
              value={settings.gstNumber}
              onChange={(e) => updateSetting('gstNumber', e.target.value)}
              placeholder="e.g., 27AABCO1234A1Z5"
            />
            <Input
              label="PAN Number"
              value={settings.panNumber}
              onChange={(e) => updateSetting('panNumber', e.target.value)}
              placeholder="e.g., AABCO1234A"
            />
          </div>
        </Card>

        {/* Contact Information */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4 flex items-center gap-2">
            <Phone size={20} />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting('email', e.target.value)}
              placeholder="store@example.com"
              leftIcon={<Mail size={16} />}
              required
            />
            <Input
              label="Phone"
              value={settings.phone}
              onChange={(e) => updateSetting('phone', e.target.value)}
              placeholder="9842253984"
              leftIcon={<Phone size={16} />}
            />
            <Input
              label="Website"
              type="url"
              value={settings.website}
              onChange={(e) => updateSetting('website', e.target.value)}
              placeholder="https://yourstore.com"
              leftIcon={<Globe size={16} />}
              className="md:col-span-2"
            />
          </div>
        </Card>

        {/* Business Address */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Business Address
          </h3>
          <div className="space-y-4">
            <Textarea
              label="Street Address"
              value={settings.address}
              onChange={(e) => updateSetting('address', e.target.value)}
              placeholder="Enter your street address"
              rows={2}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="City"
                value={settings.city}
                onChange={(e) => updateSetting('city', e.target.value)}
                placeholder="Tiruppur"
              />
              <Input
                label="State"
                value={settings.state}
                onChange={(e) => updateSetting('state', e.target.value)}
                placeholder="Maharashtra"
              />
              <Input
                label="PIN Code"
                value={settings.pincode}
                onChange={(e) => updateSetting('pincode', e.target.value)}
                placeholder="400050"
              />
              <Select
                label="Country"
                value={settings.country}
                onChange={(e) => updateSetting('country', e.target.value)}
                options={[
                  { value: 'India', label: 'India' },
                  { value: 'USA', label: 'United States' },
                  { value: 'UK', label: 'United Kingdom' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Branding */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4 flex items-center gap-2">
            <Image size={20} />
            Branding
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-[var(--admin-text-primary)] mb-2 block">
                Store Logo
              </label>
              <div className="border-2 border-dashed border-[var(--admin-border)] rounded-lg p-8 text-center hover:border-[var(--admin-primary-300)] transition-colors cursor-pointer">
                <Upload size={32} className="mx-auto text-[var(--admin-text-muted)] mb-2" />
                <p className="text-sm text-[var(--admin-text-muted)]">Click to upload logo</p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">PNG, JPG up to 2MB</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--admin-text-primary)] mb-2 block">
                Favicon
              </label>
              <div className="border-2 border-dashed border-[var(--admin-border)] rounded-lg p-8 text-center hover:border-[var(--admin-primary-300)] transition-colors cursor-pointer">
                <Upload size={32} className="mx-auto text-[var(--admin-text-muted)] mb-2" />
                <p className="text-sm text-[var(--admin-text-muted)]">Click to upload favicon</p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">32x32 or 64x64 PNG</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Operational Settings */}
        <Card>
          <h3 className="font-semibold text-[var(--admin-text-primary)] mb-4 flex items-center gap-2">
            <Clock size={20} />
            Operational Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Currency"
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
              options={[
                { value: 'INR', label: 'Indian Rupee (₹)' },
                { value: 'USD', label: 'US Dollar ($)' },
                { value: 'EUR', label: 'Euro (€)' },
              ]}
            />
            <Select
              label="Timezone"
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              options={[
                { value: 'Asia/Kolkata', label: 'India (GMT+5:30)' },
                { value: 'America/New_York', label: 'New York (GMT-5)' },
                { value: 'Europe/London', label: 'London (GMT+0)' },
              ]}
            />
            <Input
              label="Order Number Prefix"
              value={settings.orderPrefix}
              onChange={(e) => updateSetting('orderPrefix', e.target.value)}
              placeholder="e.g., ORA"
              hint="Orders will be: ORA-2024-00001"
            />
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-[var(--admin-text-primary)] mb-1">Maintenance Mode</h3>
              <p className="text-sm text-[var(--admin-text-muted)]">
                Enable to show a maintenance page to visitors
              </p>
            </div>
            <Checkbox
              checked={settings.enableMaintenance}
              onChange={(checked) => updateSetting('enableMaintenance', checked)}
            />
          </div>
          {settings.enableMaintenance && (
            <Textarea
              label="Maintenance Message"
              value={settings.maintenanceMessage}
              onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
              placeholder="We'll be back soon..."
              rows={3}
              className="mt-4"
            />
          )}
        </Card>

        {/* Save Button (Mobile) */}
        <div className="sticky bottom-4 md:hidden">
          <Button
            leftIcon={<Save size={18} />}
            onClick={handleSave}
            isLoading={saving}
            disabled={!hasChanges}
            fullWidth
          >
            Save Changes
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
