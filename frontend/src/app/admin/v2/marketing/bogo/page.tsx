'use client';

/**
 * Admin BOGO Campaign Page — /admin/v2/marketing/bogo
 *
 * Full-featured BOGO campaign management:
 *   - Campaign ON/OFF toggle
 *   - Discount type selector (FREE_CHEAPER / PERCENT / FIXED)
 *   - Allowed categories multi-select
 *   - Price tier configuration
 *   - Product table with BOGO eligibility toggles
 *   - Campaign statistics dashboard
 *
 * ORA Admin V2 design language — gold accent, white cards, clean layout
 */

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  PageHeader,
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Select,
  StatCard,
  Spinner,
  Alert,
} from '../../components/ui';
import { DataTable, Column } from '../../components/ui/DataTable';
import {
  useAdminBOGOStore,
  type BOGOProductAdmin,
} from '@/store/adminBogoStore';
import {
  Zap,
  Power,
  PowerOff,
  Tag,
  Gift,
  ShoppingBag,
  Search,
  Filter,
  Save,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  Eye,
} from 'lucide-react';
import Image from 'next/image';

// ============================================================
// Constants
// ============================================================

const PRICE_TIERS = [
  { value: 999, label: '₹999 — Everyday Essentials' },
  { value: 1499, label: '₹1,499 — Bestseller Duos' },
  { value: 1999, label: '₹1,999 — Premium Picks' },
  { value: 2599, label: '₹2,599 — Luxury Statement' },
];

const CATEGORIES = [
  { value: 'earrings', label: 'Earrings' },
  { value: 'necklaces', label: 'Necklaces' },
  { value: 'rings', label: 'Rings' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'pendants', label: 'Pendants' },
  { value: 'bangles', label: 'Bangles' },
];

const DISCOUNT_TYPES = [
  {
    value: 'FREE_CHEAPER',
    label: 'Free Cheaper Item',
    desc: 'The cheaper of the 2 products is free (50% off total)',
  },
  {
    value: 'PERCENT',
    label: 'Percentage Off',
    desc: 'X% discount on the cheaper item',
  },
  {
    value: 'FIXED',
    label: 'Fixed Amount',
    desc: 'Fixed ₹ discount on the cheaper item',
  },
];

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(n);

// ============================================================
// Page Component
// ============================================================

export default function AdminBogoPage() {
  const {
    campaign,
    campaignLoading,
    products,
    productsLoading,
    productsPagination,
    stats,
    statsLoading,
    error,
    searchQuery,
    filterTier,
    filterCategory,
    filterBogoOnly,
    fetchCampaign,
    updateCampaign,
    toggleCampaign,
    fetchProducts,
    toggleProductBOGO,
    updateProductBOGOFields,
    fetchStats,
    setSearchQuery,
    setFilterTier,
    setFilterCategory,
    setFilterBogoOnly,
  } = useAdminBOGOStore();

  const [savingCampaign, setSavingCampaign] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editTier, setEditTier] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState<string>('');

  // Local campaign form state
  const [formName, setFormName] = useState('');
  const [formDiscountType, setFormDiscountType] = useState('FREE_CHEAPER');
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [formMaxUses, setFormMaxUses] = useState(0);
  const [formCategories, setFormCategories] = useState<string[]>([]);

  // Initial fetch
  useEffect(() => {
    fetchCampaign();
    fetchProducts();
    fetchStats();
  }, [fetchCampaign, fetchProducts, fetchStats]);

  // Sync form state when campaign loads
  useEffect(() => {
    if (campaign) {
      setFormName(campaign.name);
      setFormDiscountType(campaign.discountType);
      setFormDiscountValue(campaign.discountValue);
      setFormMaxUses(campaign.maxUsesPerUser);
      setFormCategories(campaign.allowedCategories);
    }
  }, [campaign]);

  // Refetch products when filters change
  useEffect(() => {
    fetchProducts(1);
  }, [searchQuery, filterTier, filterCategory, filterBogoOnly, fetchProducts]);

  // Success toast auto-dismiss
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  // --------------------------------------------------------
  // Handlers
  // --------------------------------------------------------

  const handleToggleCampaign = async () => {
    if (!campaign) return;
    const ok = await toggleCampaign(!campaign.isActive);
    if (ok) {
      setSuccessMsg(
        campaign.isActive
          ? 'BOGO campaign deactivated'
          : 'BOGO campaign activated!',
      );
      fetchStats();
    }
  };

  const handleSaveCampaign = async () => {
    setSavingCampaign(true);
    const ok = await updateCampaign({
      name: formName,
      discountType: formDiscountType as 'FREE_CHEAPER' | 'PERCENT' | 'FIXED',
      discountValue: formDiscountValue,
      maxUsesPerUser: formMaxUses,
      allowedCategories: formCategories,
    });
    setSavingCampaign(false);
    if (ok) {
      setSuccessMsg('Campaign settings saved');
      fetchStats();
    }
  };

  const handleToggleProduct = async (product: BOGOProductAdmin) => {
    if (product.isBOGOEligible) {
      // Disable BOGO
      const ok = await toggleProductBOGO(product.id, false);
      if (ok) {
        setSuccessMsg(`${product.name} removed from BOGO`);
        fetchStats();
      }
    } else {
      // Start editing to set tier + category
      setEditingProduct(product.id);
      setEditTier(product.bogoPriceTier || PRICE_TIERS[0].value);
      setEditCategory(product.bogoCategory || CATEGORIES[0].value);
    }
  };

  const handleConfirmEnable = async () => {
    if (!editingProduct || !editTier || !editCategory) return;
    const ok = await toggleProductBOGO(
      editingProduct,
      true,
      editTier,
      editCategory,
    );
    if (ok) {
      setSuccessMsg('Product added to BOGO campaign');
      fetchStats();
    }
    setEditingProduct(null);
  };

  const handleUpdateProductFields = async (
    productId: string,
    tier: number,
    category: string,
  ) => {
    const ok = await updateProductBOGOFields(productId, {
      bogoPriceTier: tier,
      bogoCategory: category,
    });
    if (ok) setSuccessMsg('Product BOGO settings updated');
  };

  const toggleCategory = (cat: string) => {
    setFormCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat],
    );
  };

  // --------------------------------------------------------
  // Table Columns
  // --------------------------------------------------------

  const columns: Column<BOGOProductAdmin>[] = [
    {
      id: 'product',
      header: 'Product',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {row.image ? (
              <Image
                src={row.image}
                alt={row.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
            <p className="text-xs text-gray-500 truncate">{row.slug}</p>
          </div>
        </div>
      ),
      width: '280px',
    },
    {
      id: 'price',
      header: 'Price',
      accessor: (row) => (
        <span className="text-sm font-semibold text-gray-900">
          {formatINR(row.finalPrice)}
        </span>
      ),
      width: '100px',
      align: 'right',
    },
    {
      id: 'stock',
      header: 'Stock',
      accessor: (row) => (
        <span
          className={`text-sm font-medium ${
            row.stockQuantity < 10
              ? 'text-red-600'
              : row.stockQuantity < 25
                ? 'text-amber-600'
                : 'text-green-600'
          }`}
        >
          {row.stockQuantity}
        </span>
      ),
      width: '80px',
      align: 'center',
    },
    {
      id: 'bogoStatus',
      header: 'BOGO Status',
      accessor: (row) => (
        <Badge variant={row.isBOGOEligible ? 'success' : 'warning'} size="sm">
          {row.isBOGOEligible ? 'Eligible' : 'Not BOGO'}
        </Badge>
      ),
      width: '120px',
      align: 'center',
    },
    {
      id: 'tier',
      header: 'Price Tier',
      accessor: (row) =>
        row.isBOGOEligible && row.bogoPriceTier ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Tag className="w-3 h-3" />₹{row.bogoPriceTier.toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      width: '120px',
      align: 'center',
    },
    {
      id: 'category',
      header: 'BOGO Category',
      accessor: (row) =>
        row.isBOGOEligible && row.bogoCategory ? (
          <span className="text-sm text-gray-700 capitalize">{row.bogoCategory}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
      width: '120px',
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleToggleProduct(row)}
            className={`
              inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${
                row.isBOGOEligible
                  ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              }
            `}
          >
            {row.isBOGOEligible ? (
              <>
                <XCircle className="w-3.5 h-3.5" /> Remove
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Add to BOGO
              </>
            )}
          </button>
        </div>
      ),
      width: '140px',
      align: 'center',
    },
  ];

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  if (campaignLoading && !campaign) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
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
          title="BOGO Campaign"
          description="Manage your Buy One Get One Free campaign — toggle products, set discount rules, and monitor performance."
          breadcrumbs={[
            { label: 'Admin', href: '/admin/v2' },
            { label: 'Marketing', href: '/admin/v2/marketing' },
            { label: 'BOGO Campaign' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  fetchCampaign();
                  fetchProducts();
                  fetchStats();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Refresh
              </Button>
              <a
                href="/collections/combos"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="sm">
                  <Eye className="w-4 h-4 mr-1.5" />
                  View Storefront
                </Button>
              </a>
            </div>
          }
        />

        {/* Success / Error Messages */}
        {successMsg && (
          <Alert variant="success" title="Success" dismissible onDismiss={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}
        {error && (
          <Alert variant="error" title="Error" dismissible onDismiss={() => useAdminBOGOStore.setState({ error: null })}>
            {error}
          </Alert>
        )}

        {/* ====================================================== */}
        {/* CAMPAIGN TOGGLE + STATS */}
        {/* ====================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Campaign Status Card */}
          <Card padding="md" className="lg:col-span-1">
            <div className="flex flex-col items-center justify-center h-full gap-4 py-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  campaign?.isActive
                    ? 'bg-green-100 text-green-600'
                    : 'bg-red-100 text-red-500'
                }`}
              >
                {campaign?.isActive ? (
                  <Power className="w-8 h-8" />
                ) : (
                  <PowerOff className="w-8 h-8" />
                )}
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  Campaign {campaign?.isActive ? 'Active' : 'Inactive'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {campaign?.isActive
                    ? 'BOGO deals are live on the storefront'
                    : 'BOGO deals are hidden from customers'}
                </p>
              </div>
              <button
                onClick={handleToggleCampaign}
                className={`
                  w-full py-2.5 rounded-lg font-semibold text-sm transition-colors
                  ${
                    campaign?.isActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }
                `}
              >
                {campaign?.isActive ? 'Deactivate Campaign' : 'Activate Campaign'}
              </button>
            </div>
          </Card>

          {/* Stats Cards */}
          <StatCard
            title="Eligible Products"
            value={stats?.totalEligibleProducts ?? 0}
            icon={<Package className="w-5 h-5" />}
            subtitle={`of ${stats?.totalProducts ?? 0} total products`}
            variant="default"
          />
          <StatCard
            title="Times Used"
            value={stats?.totalUsageCount ?? 0}
            icon={<ShoppingBag className="w-5 h-5" />}
            subtitle="Total BOGO orders"
            variant="default"
          />
          <StatCard
            title="Discount Type"
            value={
              stats?.discountType === 'FREE_CHEAPER'
                ? 'Free Item'
                : stats?.discountType === 'PERCENT'
                  ? '% Off'
                  : '₹ Fixed'
            }
            icon={<Gift className="w-5 h-5" />}
            subtitle="Current discount rule"
            variant="default"
          />
        </div>

        {/* Tier Breakdown */}
        {stats && (
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-6 px-2">
              <span className="text-sm font-medium text-gray-600">Tier Breakdown:</span>
              {PRICE_TIERS.map((t) => (
                <div key={t.value} className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border"
                    style={{
                      backgroundColor: 'rgba(212, 175, 55, 0.08)',
                      borderColor: 'rgba(212, 175, 55, 0.3)',
                      color: '#b8962e',
                    }}
                  >
                    ₹{t.value.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {stats.tierBreakdown[t.value] ?? 0}
                  </span>
                  <span className="text-xs text-gray-400">products</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ====================================================== */}
        {/* CAMPAIGN SETTINGS */}
        {/* ====================================================== */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Campaign Settings</CardTitle>
            <CardDescription>
              Configure how the BOGO discount is applied and which categories are
              included.
            </CardDescription>
          </CardHeader>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campaign Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Combos for Her — BOGO"
              />
            </div>

            {/* Max Uses per User */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Max Uses Per Customer
              </label>
              <Input
                type="number"
                value={String(formMaxUses)}
                onChange={(e) => setFormMaxUses(parseInt(e.target.value) || 0)}
                placeholder="0 = unlimited"
              />
              <p className="text-xs text-gray-400">
                Set to 0 for unlimited BOGO purchases per customer
              </p>
            </div>

            {/* Discount Type */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Discount Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DISCOUNT_TYPES.map((dt) => (
                  <button
                    key={dt.value}
                    onClick={() => setFormDiscountType(dt.value)}
                    className={`
                      p-4 rounded-xl border-2 text-left transition-all
                      ${
                        formDiscountType === dt.value
                          ? 'border-[#d4af37] bg-amber-50/50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {dt.value === 'FREE_CHEAPER' && <Gift className="w-4 h-4 text-green-600" />}
                      {dt.value === 'PERCENT' && <Percent className="w-4 h-4 text-blue-600" />}
                      {dt.value === 'FIXED' && <DollarSign className="w-4 h-4 text-purple-600" />}
                      <span className="text-sm font-semibold text-gray-900">
                        {dt.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{dt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Discount Value (only for PERCENT / FIXED) */}
            {formDiscountType !== 'FREE_CHEAPER' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Discount Value{' '}
                  {formDiscountType === 'PERCENT' ? '(%)' : '(₹)'}
                </label>
                <Input
                  type="number"
                  value={String(formDiscountValue)}
                  onChange={(e) =>
                    setFormDiscountValue(parseFloat(e.target.value) || 0)
                  }
                  placeholder={
                    formDiscountType === 'PERCENT' ? 'e.g. 30' : 'e.g. 500'
                  }
                />
              </div>
            )}

            {/* Allowed Categories */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allowed Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = formCategories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      onClick={() => toggleCategory(cat.value)}
                      className={`
                        inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all border
                        ${
                          isSelected
                            ? 'bg-[#d4af37] text-white border-[#d4af37] shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {cat.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">
                Leave empty to allow all product categories
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" size="sm" onClick={fetchCampaign}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCampaign}
              disabled={savingCampaign}
            >
              {savingCampaign ? (
                <>
                  <Spinner size="sm" className="mr-1.5" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" /> Save Settings
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* ====================================================== */}
        {/* PRODUCT BOGO TABLE */}
        {/* ====================================================== */}
        <Card padding="sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Product BOGO Eligibility</CardTitle>
                <CardDescription>
                  Toggle which products are included in the BOGO campaign. Set
                  their price tier and category.
                </CardDescription>
              </div>
              <Badge variant="info" size="md">
                {stats?.totalEligibleProducts ?? 0} / {stats?.totalProducts ?? 0} eligible
              </Badge>
            </div>
          </CardHeader>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-3 px-4 pb-4 border-b border-gray-100">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Input
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              options={[
                { value: '', label: 'All Tiers' },
                ...PRICE_TIERS.map((t) => ({ value: String(t.value), label: `₹${t.value.toLocaleString()}` })),
              ]}
            />
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                ...CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
              ]}
            />
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterBogoOnly}
                onChange={(e) => setFilterBogoOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#d4af37] focus:ring-[#fde8b3]"
              />
              <span className="text-sm text-gray-600">BOGO only</span>
            </label>
          </div>

          {/* Data Table */}
          <DataTable<BOGOProductAdmin>
            data={products}
            columns={columns}
            loading={productsLoading}
            getRowId={(row) => row.id}
            pagination={{
              page: productsPagination.page,
              pageSize: productsPagination.limit,
              total: productsPagination.total,
              onPageChange: (p) => fetchProducts(p),
            }}
          />
        </Card>

        {/* ====================================================== */}
        {/* ENABLE BOGO MODAL (inline) */}
        {/* ====================================================== */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Enable BOGO for Product
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                Choose the price tier and category for this product in the BOGO
                campaign.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Price Tier
                  </label>
                  <Select
                    value={String(editTier)}
                    onChange={(e) => setEditTier(parseInt(e.target.value))}
                    options={PRICE_TIERS.map((t) => ({ value: String(t.value), label: t.label }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    BOGO Category
                  </label>
                  <Select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmEnable}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Enable BOGO
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
