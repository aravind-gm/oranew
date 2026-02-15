'use client';

/**
 * ORA Admin Panel - Tax Configuration
 * =====================================
 * 
 * Manage GST rates per product category.
 * Priority: Product.gstRate > TaxConfig by category > default 3%
 */

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { PageHeader, Button, Card, CardTitle, Input, Select, Alert, Badge, Spinner } from '../../components/ui';
import { Save, Receipt, ArrowLeft, Plus, Trash2, Edit, Info, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface TaxConfigEntry {
  id: string;
  categorySlug: string;
  gstRate: number;
  label: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TaxSettingsPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<TaxConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New entry form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categorySlug: '',
    gstRate: 3,
    label: 'GST',
    isActive: true,
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings/taxes');
      setConfigs(res.data.data || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load tax configs' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.categorySlug.trim()) {
      setMessage({ type: 'error', text: 'Category slug is required' });
      return;
    }
    if (formData.gstRate < 0 || formData.gstRate > 28) {
      setMessage({ type: 'error', text: 'GST rate must be between 0% and 28%' });
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/settings/taxes', formData);
      setMessage({ type: 'success', text: `Tax config for "${formData.categorySlug}" saved. Cache invalidated.` });
      setShowForm(false);
      setEditingId(null);
      setFormData({ categorySlug: '', gstRate: 3, label: 'GST', isActive: true });
      await fetchConfigs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save tax config' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: TaxConfigEntry) => {
    setFormData({
      categorySlug: entry.categorySlug,
      gstRate: Number(entry.gstRate),
      label: entry.label,
      isActive: entry.isActive,
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Delete tax config for "${slug}"? The default 3% GST rate will apply.`)) return;

    try {
      await api.delete(`/admin/settings/taxes/${id}`);
      setMessage({ type: 'success', text: `Tax config for "${slug}" deleted` });
      await fetchConfigs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete tax config' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ categorySlug: '', gstRate: 3, label: 'GST', isActive: true });
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Tax Configuration"
          description="Manage GST rates by product category"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Settings', href: '/admin/v2/settings' },
            { label: 'Taxes' },
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
              {!showForm && (
                <Button
                  leftIcon={<Plus size={18} />}
                  onClick={() => setShowForm(true)}
                >
                  Add Tax Rule
                </Button>
              )}
            </>
          }
        />

        {/* Messages */}
        {message && (
          <Alert variant={message.type === 'success' ? 'success' : 'error'}>
            {message.text}
          </Alert>
        )}

        {/* Info Banner */}
        <Card>
          <div className="flex items-start gap-3">
            <Info size={18} className="text-[#d4af37] mt-0.5 flex-shrink-0" />
            <div className="text-sm text-[#4b5563]">
              <p className="font-medium text-[#111827] mb-1">GST Rate Priority</p>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>Product-level override</strong> — Set on individual products (highest priority)</li>
                <li><strong>Category-level config</strong> — Managed here, by category slug</li>
                <li><strong>Default rate</strong> — 3% GST (jewellery standard in India)</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <CardTitle className="mb-4">
              {editingId ? 'Edit Tax Rule' : 'New Tax Rule'}
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Category Slug"
                placeholder="e.g., jewellery, tumblers"
                value={formData.categorySlug}
                onChange={(e) => setFormData(prev => ({ ...prev, categorySlug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                disabled={!!editingId}
                hint={editingId ? 'Cannot change category slug' : 'Must match existing category slug'}
              />
              <Input
                label="GST Rate (%)"
                type="number"
                min={0}
                max={28}
                step={0.5}
                value={formData.gstRate}
                onChange={(e) => setFormData(prev => ({ ...prev, gstRate: Number(e.target.value) }))}
                leftIcon={<span className="text-sm">%</span>}
              />
              <Input
                label="Label"
                placeholder="GST"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleSave} isLoading={saving} leftIcon={<Check size={18} />}>
                {editingId ? 'Update' : 'Save'}
              </Button>
              <Button variant="ghost" onClick={handleCancel} leftIcon={<X size={18} />}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Tax Configs Table */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <Receipt size={20} className="text-[#d4af37]" />
            Tax Rules ({configs.length})
          </CardTitle>

          {configs.length === 0 ? (
            <div className="text-center py-8">
              <Receipt size={40} className="mx-auto text-[#9ca3af] mb-3" />
              <p className="text-sm text-[#9ca3af] mb-2">No custom tax rules configured</p>
              <p className="text-xs text-[#9ca3af]">Default 3% GST applies to all products</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb]">
                    <th className="text-left py-3 px-4 font-semibold text-[#374151]">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#374151]">GST Rate</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#374151]">Label</th>
                    <th className="text-left py-3 px-4 font-semibold text-[#374151]">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-[#374151]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((entry) => (
                    <tr key={entry.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb]">
                      <td className="py-3 px-4">
                        <code className="bg-[#f3f4f6] px-2 py-1 rounded text-xs font-mono">
                          {entry.categorySlug}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{Number(entry.gstRate)}%</span>
                      </td>
                      <td className="py-3 px-4 text-[#4b5563]">{entry.label}</td>
                      <td className="py-3 px-4">
                        <Badge variant={entry.isActive ? 'success' : 'secondary'}>
                          {entry.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-1.5 hover:bg-[#f3f4f6] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} className="text-[#4b5563]" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id, entry.categorySlug)}
                            className="p-1.5 hover:bg-[#fef2f2] rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} className="text-[#dc2626]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Default Rate Info */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#111827]">Default GST Rate</h3>
              <p className="text-sm text-[#9ca3af]">Applied when no product or category override exists</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#111827]">3%</span>
              <p className="text-xs text-[#9ca3af]">Standard jewellery GST</p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
