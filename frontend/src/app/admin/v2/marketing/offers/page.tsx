'use client';

/**
 * ORA Admin Panel — Offers & Deals Management
 * =============================================
 *
 * Campaign-level controls:
 * - Activate / Deactivate global offer campaign
 * - Set discount type (PERCENT, FIXED, BOGO, CLEARANCE)
 * - Collection targeting
 * - Start / End dates with live countdown preview
 * - Banner text for storefront
 * - View all products currently on offer
 * - Quick-edit offer settings per product
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  Power,
  PowerOff,
  Tag,
  Clock,
  Percent,
  Gift,
  Zap,
  AlertCircle,
  Check,
  X,
  Search,
  ChevronDown,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface OfferCampaign {
  id: string;
  name: string;
  isActive: boolean;
  discountType: 'PERCENT' | 'FIXED' | 'BOGO' | 'CLEARANCE';
  discountValue: number;
  collections: string[];
  startDate: string;
  endDate: string;
  showCountdown: boolean;
  bannerText: string;
  totalUsageCount: number;
}

interface OfferProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPercent: number;
  finalPrice: number;
  image: string;
  isOnOffer: boolean;
  offerType: string;
  offerValue: number;
  offerExpiry: string;
  showCountdown: boolean;
  stockQuantity: number;
  category: string;
}

// ============================================
// COUNTDOWN PREVIEW COMPONENT
// ============================================

function CountdownPreview({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;
    const target = new Date(endDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  if (!endDate) return <p className="text-sm text-[#9ca3af]">Set end date to preview countdown</p>;

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Mins', value: timeLeft.minutes },
    { label: 'Secs', value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3">
      {blocks.map((block) => (
        <div key={block.label} className="text-center">
          <div className="w-14 h-14 bg-[#0F0F14] rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">
              {String(block.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] text-[#9ca3af] mt-1 block uppercase tracking-wider">
            {block.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function OffersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaign' | 'products'>('campaign');

  // Campaign state
  const [campaign, setCampaign] = useState<OfferCampaign>({
    id: '',
    name: 'Summer Flash Sale',
    isActive: false,
    discountType: 'PERCENT',
    discountValue: 20,
    collections: [],
    startDate: '',
    endDate: '',
    showCountdown: true,
    bannerText: '',
    totalUsageCount: 0,
  });

  // Products state
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.orashop.in/api';

  // Fetch campaign data
  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/offers/admin/campaign`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          setCampaign({
            ...data.campaign,
            startDate: data.campaign.startDate ? new Date(data.campaign.startDate).toISOString().slice(0, 16) : '',
            endDate: data.campaign.endDate ? new Date(data.campaign.endDate).toISOString().slice(0, 16) : '',
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch campaign:', err);
    }
  }, [API_URL]);

  // Fetch offer products
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (productSearch) params.set('search', productSearch);
      if (productFilter !== 'all') params.set('offerType', productFilter);

      const res = await fetch(`${API_URL}/offers/admin/products?${params}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [API_URL, productSearch, productFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCampaign(), fetchProducts()]);
      setLoading(false);
    };
    init();
  }, [fetchCampaign, fetchProducts]);

  // Save campaign
  const handleSaveCampaign = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/offers/admin/campaign`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaign),
      });

      if (res.ok) {
        const data = await res.json();
        setCampaign(prev => ({ ...prev, ...data.campaign }));
      }
    } catch (err) {
      console.error('Failed to save campaign:', err);
    } finally {
      setSaving(false);
    }
  };

  // Toggle campaign active status
  const handleToggleCampaign = async () => {
    setCampaign(prev => ({ ...prev, isActive: !prev.isActive }));
    // Save will happen when user clicks Save
  };

  // Update single product offer settings
  const handleUpdateProductOffer = async (productId: string, updates: Partial<OfferProduct>) => {
    try {
      const res = await fetch(`${API_URL}/offers/admin/products/${productId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updates } : p));
        setEditingProduct(null);
      }
    } catch (err) {
      console.error('Failed to update product:', err);
    }
  };

  // Remove product from offers
  const handleRemoveFromOffer = async (productId: string) => {
    await handleUpdateProductOffer(productId, {
      isOnOffer: false,
      offerType: '',
      offerValue: 0,
      offerExpiry: '',
      showCountdown: false,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  const filteredProducts = products.filter(p => {
    if (productFilter === 'active') return p.isOnOffer;
    if (productFilter === 'inactive') return !p.isOnOffer;
    if (productFilter === 'PERCENT' || productFilter === 'FIXED' || productFilter === 'BOGO' || productFilter === 'CLEARANCE') {
      return p.offerType === productFilter;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <PageHeader
          title="Offers & Deals"
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Marketing', href: '/admin/v2/marketing' },
            { label: 'Offers & Deals' },
          ]}
          actions={
            <>
              <Button
                variant="ghost"
                leftIcon={<RefreshCw size={18} />}
                onClick={() => { fetchCampaign(); fetchProducts(); }}
              >
                Refresh
              </Button>
              <Button
                variant={campaign.isActive ? 'secondary' : 'primary'}
                leftIcon={campaign.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                onClick={handleToggleCampaign}
              >
                {campaign.isActive ? 'Deactivate Campaign' : 'Activate Campaign'}
              </Button>
            </>
          }
        />

        {/* Status Banner */}
        <Alert variant={campaign.isActive ? 'success' : 'warning'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${campaign.isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className="font-medium">
                {campaign.isActive
                  ? `Campaign "${campaign.name}" is LIVE — ${products.filter(p => p.isOnOffer).length} products on offer`
                  : 'No active campaign. Activate to show offers on the storefront.'}
              </span>
            </div>
            {campaign.isActive && campaign.totalUsageCount > 0 && (
              <Badge variant="success">{campaign.totalUsageCount} redemptions</Badge>
            )}
          </div>
        </Alert>

        {/* Tabs */}
        <div className="flex border-b border-[#e5e7eb]">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'campaign'
                ? 'border-[#E91E63] text-[#E91E63]'
                : 'border-transparent text-[#9ca3af] hover:text-[#111827]'
            }`}
            onClick={() => setActiveTab('campaign')}
          >
            Campaign Settings
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'products'
                ? 'border-[#E91E63] text-[#E91E63]'
                : 'border-transparent text-[#9ca3af] hover:text-[#111827]'
            }`}
            onClick={() => setActiveTab('products')}
          >
            Offer Products ({products.filter(p => p.isOnOffer).length})
          </button>
        </div>

        {/* Campaign Settings Tab */}
        {activeTab === 'campaign' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left - Settings */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardTitle className="mb-4">Campaign Details</CardTitle>
                <div className="space-y-4">
                  <Input
                    label="Campaign Name"
                    placeholder="e.g., Summer Flash Sale"
                    value={campaign.name}
                    onChange={(e) => setCampaign(prev => ({ ...prev, name: e.target.value }))}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Default Discount Type"
                      value={campaign.discountType}
                      onChange={(e) => setCampaign(prev => ({ ...prev, discountType: e.target.value as OfferCampaign['discountType'] }))}
                      options={[
                        { value: 'PERCENT', label: 'Percentage Discount' },
                        { value: 'FIXED', label: 'Fixed Amount Off' },
                        { value: 'BOGO', label: 'Buy One Get One' },
                        { value: 'CLEARANCE', label: 'Clearance Sale' },
                      ]}
                    />

                    {(campaign.discountType === 'PERCENT' || campaign.discountType === 'FIXED') && (
                      <Input
                        label={campaign.discountType === 'PERCENT' ? 'Default Discount (%)' : 'Default Discount (₹)'}
                        type="number"
                        min={0}
                        max={campaign.discountType === 'PERCENT' ? 100 : undefined}
                        value={campaign.discountValue}
                        onChange={(e) => setCampaign(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                        leftIcon={<span className="text-sm">{campaign.discountType === 'PERCENT' ? '%' : '₹'}</span>}
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="datetime-local"
                      value={campaign.startDate}
                      onChange={(e) => setCampaign(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                    <Input
                      label="End Date"
                      type="datetime-local"
                      value={campaign.endDate}
                      onChange={(e) => setCampaign(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>

                  <Textarea
                    label="Banner Text"
                    placeholder="Shown on the offers page hero — e.g., Up to 50% Off on Select Tumblers & Gifts!"
                    value={campaign.bannerText}
                    onChange={(e) => setCampaign(prev => ({ ...prev, bannerText: e.target.value }))}
                    rows={2}
                  />

                  <div>
                    <label className="block mb-2 text-sm font-medium text-[#111827]">
                      Target Collections
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['tumblers', 'necklaces', 'earrings', 'rings', 'bracelets', 'bangles', 'gifts'].map((col) => (
                        <Checkbox
                          key={col}
                          label={col.charAt(0).toUpperCase() + col.slice(1)}
                          checked={campaign.collections.includes(col)}
                          onChange={(e) => {
                            const newCols = e.target.checked
                              ? [...campaign.collections, col]
                              : campaign.collections.filter(c => c !== col);
                            setCampaign(prev => ({ ...prev, collections: newCols }));
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <Checkbox
                    label="Show Countdown Timer"
                    description="Display a live countdown on the offers page and product cards"
                    checked={campaign.showCountdown}
                    onChange={(e) => setCampaign(prev => ({ ...prev, showCountdown: e.target.checked }))}
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    leftIcon={<Save size={18} />}
                    onClick={handleSaveCampaign}
                    isLoading={saving}
                  >
                    Save Campaign
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right - Preview */}
            <div className="space-y-6">
              <Card>
                <CardTitle className="mb-4">Countdown Preview</CardTitle>
                <CountdownPreview endDate={campaign.endDate} />
              </Card>

              <Card>
                <CardTitle className="mb-4">Campaign Summary</CardTitle>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Status</span>
                    <Badge variant={campaign.isActive ? 'success' : 'secondary'}>
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Type</span>
                    <span className="text-sm font-medium">{campaign.discountType}</span>
                  </div>
                  {(campaign.discountType === 'PERCENT' || campaign.discountType === 'FIXED') && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[#9ca3af]">Value</span>
                      <span className="text-sm font-medium">
                        {campaign.discountType === 'PERCENT' ? `${campaign.discountValue}%` : `₹${campaign.discountValue}`}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Products</span>
                    <span className="text-sm font-medium">{products.filter(p => p.isOnOffer).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Collections</span>
                    <span className="text-sm font-medium">{campaign.collections.length || 'All'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#9ca3af]">Redemptions</span>
                    <span className="text-sm font-medium">{campaign.totalUsageCount}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <CardTitle className="mb-4">Quick Stats</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#f6f7f9] rounded-lg text-center">
                    <p className="text-2xl font-bold text-[#E91E63]">
                      {products.filter(p => p.isOnOffer && p.offerType === 'PERCENT').length}
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">% Discounts</p>
                  </div>
                  <div className="p-3 bg-[#f6f7f9] rounded-lg text-center">
                    <p className="text-2xl font-bold text-[#C6A85B]">
                      {products.filter(p => p.isOnOffer && p.offerType === 'BOGO').length}
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">BOGO Items</p>
                  </div>
                  <div className="p-3 bg-[#f6f7f9] rounded-lg text-center">
                    <p className="text-2xl font-bold text-[#111827]">
                      {products.filter(p => p.isOnOffer && p.offerType === 'FIXED').length}
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">Fixed Off</p>
                  </div>
                  <div className="p-3 bg-[#f6f7f9] rounded-lg text-center">
                    <p className="text-2xl font-bold text-[#dc2626]">
                      {products.filter(p => p.isOnOffer && p.offerType === 'CLEARANCE').length}
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">Clearance</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Offer Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <Card>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[#d1d5db] rounded-lg text-sm focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  {['all', 'active', 'inactive', 'PERCENT', 'BOGO', 'CLEARANCE'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setProductFilter(filter)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        productFilter === filter
                          ? 'bg-[#E91E63] text-white'
                          : 'bg-[#f6f7f9] text-[#9ca3af] hover:bg-[#ececf2]'
                      }`}
                    >
                      {filter === 'all' ? 'All' : filter === 'active' ? 'Active' : filter === 'inactive' ? 'Inactive' : filter}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Products Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e7eb]">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Product</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Price</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Offer Type</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Value</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Expiry</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Status</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="text-[#9ca3af]">
                            <Tag size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium">No products found</p>
                            <p className="text-xs mt-1">Add offer settings to products via the product editor</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-[#f3f4f6] hover:bg-[#f9fafb] transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#f6f7f9] rounded-lg overflow-hidden flex-shrink-0">
                                {product.image ? (
                                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Tag size={16} className="text-[#9ca3af]" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#111827] line-clamp-1">{product.name}</p>
                                <p className="text-xs text-[#9ca3af]">{product.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium">₹{product.price.toLocaleString()}</p>
                            {product.discountPercent > 0 && (
                              <p className="text-xs text-green-600">-{product.discountPercent}%</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingProduct === product.id ? (
                              <select
                                value={product.offerType}
                                onChange={(e) => {
                                  setProducts(prev => prev.map(p =>
                                    p.id === product.id ? { ...p, offerType: e.target.value } : p
                                  ));
                                }}
                                className="text-sm border border-[#d1d5db] rounded px-2 py-1"
                              >
                                <option value="">None</option>
                                <option value="PERCENT">% Off</option>
                                <option value="FIXED">₹ Off</option>
                                <option value="BOGO">BOGO</option>
                                <option value="CLEARANCE">Clearance</option>
                              </select>
                            ) : (
                              <Badge
                                variant={
                                  product.offerType === 'BOGO' ? 'warning' :
                                  product.offerType === 'CLEARANCE' ? 'error' :
                                  product.offerType ? 'primary' : 'secondary'
                                }
                                size="sm"
                              >
                                {product.offerType || 'None'}
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingProduct === product.id ? (
                              <input
                                type="number"
                                value={product.offerValue}
                                onChange={(e) => {
                                  setProducts(prev => prev.map(p =>
                                    p.id === product.id ? { ...p, offerValue: Number(e.target.value) } : p
                                  ));
                                }}
                                className="w-20 text-sm border border-[#d1d5db] rounded px-2 py-1"
                              />
                            ) : (
                              <span className="text-sm">
                                {product.offerType === 'PERCENT' ? `${product.offerValue}%` :
                                 product.offerType === 'FIXED' ? `₹${product.offerValue}` :
                                 product.offerType === 'BOGO' ? '2-for-1' : '—'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {editingProduct === product.id ? (
                              <input
                                type="datetime-local"
                                value={product.offerExpiry ? new Date(product.offerExpiry).toISOString().slice(0, 16) : ''}
                                onChange={(e) => {
                                  setProducts(prev => prev.map(p =>
                                    p.id === product.id ? { ...p, offerExpiry: e.target.value } : p
                                  ));
                                }}
                                className="text-sm border border-[#d1d5db] rounded px-2 py-1"
                              />
                            ) : (
                              <span className="text-xs text-[#9ca3af]">
                                {product.offerExpiry
                                  ? new Date(product.offerExpiry).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric',
                                    })
                                  : 'No expiry'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={product.isOnOffer ? 'success' : 'secondary'}
                              size="sm"
                            >
                              {product.isOnOffer ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {editingProduct === product.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateProductOffer(product.id, {
                                      offerType: product.offerType,
                                      offerValue: product.offerValue,
                                      offerExpiry: product.offerExpiry,
                                    })}
                                    className="p-1.5 bg-green-50 rounded hover:bg-green-100 text-green-600"
                                    title="Save"
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => setEditingProduct(null)}
                                    className="p-1.5 bg-gray-50 rounded hover:bg-gray-100 text-gray-600"
                                    title="Cancel"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingProduct(product.id)}
                                    className="p-1.5 bg-blue-50 rounded hover:bg-blue-100 text-blue-600"
                                    title="Edit Offer"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  {product.isOnOffer && (
                                    <button
                                      onClick={() => handleRemoveFromOffer(product.id)}
                                      className="p-1.5 bg-red-50 rounded hover:bg-red-100 text-red-600"
                                      title="Remove from Offers"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
