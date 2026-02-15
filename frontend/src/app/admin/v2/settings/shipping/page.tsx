'use client';

/**
 * ORA Admin Panel - Shipping Configuration
 * ==========================================
 * 
 * Manage shipping rules: free threshold and standard fee.
 * Changes invalidate the backend cache automatically.
 */

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, CardTitle, Input, Alert, Badge, Spinner } from '../../components/ui';
import { Save, Truck, ArrowLeft, RefreshCw, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface ShippingConfig {
  id?: string;
  freeThreshold: number;
  standardFee: number;
  isActive: boolean;
}

export default function ShippingSettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ShippingConfig>({
    freeThreshold: 999,
    standardFee: 99,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<ShippingConfig | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings/shipping');
      const data = res.data.data;
      const cfg: ShippingConfig = {
        id: data.id,
        freeThreshold: Number(data.freeThreshold),
        standardFee: Number(data.standardFee),
        isActive: data.isActive ?? true,
      };
      setConfig(cfg);
      setOriginalConfig(cfg);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load shipping config' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ShippingConfig, value: number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (config.freeThreshold < 0 || config.standardFee < 0) {
      setMessage({ type: 'error', text: 'Values must be non-negative' });
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/admin/settings/shipping', {
        freeThreshold: config.freeThreshold,
        standardFee: config.standardFee,
      });
      setConfig(prev => ({ ...prev, id: res.data.data.id }));
      setOriginalConfig({ ...config, id: res.data.data.id });
      setHasChanges(false);
      setMessage({ type: 'success', text: 'Shipping config updated. Cache invalidated.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save shipping config' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig(originalConfig);
      setHasChanges(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Shipping Configuration"
          description="Manage shipping fees and free shipping threshold"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Settings', href: '/admin/v2/settings' },
            { label: 'Shipping' },
          ]}
          actions={
            <>
              <Button
                variant="ghost"
                leftIcon={<ArrowLeft size={18} />}
                onClick={() => router.push('/admin/v2/settings')}
              >
                Back
              </Button>
              {hasChanges && (
                <Button variant="secondary" onClick={handleReset}>
                  Discard
                </Button>
              )}
              <Button
                onClick={handleSave}
                isLoading={saving}
                leftIcon={<Save size={18} />}
                disabled={!hasChanges}
              >
                Save Changes
              </Button>
            </>
          }
        />

        {/* Messages */}
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'}>
            {message.text}
          </Alert>
        )}

        {/* Configuration Card */}
        <Card>
          <CardTitle className="mb-6 flex items-center gap-2">
            <Truck size={20} className="text-[#d4af37]" />
            Shipping Rules
          </CardTitle>

          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-4 flex items-start gap-3">
              <Info size={18} className="text-[#92400e] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-[#92400e]">
                <p className="font-medium mb-1">How shipping works</p>
                <p>
                  Orders above the free shipping threshold get free shipping. 
                  Orders below the threshold are charged the standard flat fee.
                  Changes take effect immediately (cache is auto-invalidated).
                </p>
              </div>
            </div>

            {/* Free Shipping Threshold */}
            <div>
              <Input
                label="Free Shipping Threshold (₹)"
                type="number"
                min={0}
                value={config.freeThreshold}
                onChange={(e) => handleChange('freeThreshold', Number(e.target.value))}
                leftIcon={<span className="text-sm font-medium">₹</span>}
                hint={`Orders ≥ ₹${config.freeThreshold.toLocaleString('en-IN')} get free shipping`}
              />
            </div>

            {/* Standard Shipping Fee */}
            <div>
              <Input
                label="Standard Shipping Fee (₹)"
                type="number"
                min={0}
                value={config.standardFee}
                onChange={(e) => handleChange('standardFee', Number(e.target.value))}
                leftIcon={<span className="text-sm font-medium">₹</span>}
                hint={`Charged on orders below ₹${config.freeThreshold.toLocaleString('en-IN')}`}
              />
            </div>

            {/* Preview */}
            <div className="bg-[#f6f7f9] rounded-lg p-4">
              <h4 className="text-sm font-semibold text-[#374151] mb-3">Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                  <p className="text-xs text-[#9ca3af] mb-1">Order: ₹500</p>
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-[#4b5563]" />
                    <span className="font-medium text-[#111827]">
                      + ₹{config.standardFee}
                    </span>
                    <Badge variant="secondary" size="sm">Standard</Badge>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-[#e5e7eb]">
                  <p className="text-xs text-[#9ca3af] mb-1">Order: ₹{config.freeThreshold.toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-[#16a34a]" />
                    <span className="font-medium text-[#16a34a]">FREE</span>
                    <Badge variant="success" size="sm">Free Shipping</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Current Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#111827]">Status</h3>
              <p className="text-sm text-[#9ca3af]">Shipping rules are active and applied to all orders</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
