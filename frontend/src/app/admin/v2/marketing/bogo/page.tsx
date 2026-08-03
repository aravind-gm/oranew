'use client';

/**
 * Admin Offer Campaign Page — /admin/v2/marketing/bogo
 *
 * "Buy Any Necklace, Get a Ring FREE" — campaign management.
 * URL preserved at /marketing/bogo for backwards nav compat.
 */

import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import api from '@/lib/api';
import {
  Zap, Power, PowerOff, Gift, Tag, Package, Search, Save, RefreshCw, CheckCircle2,
} from 'lucide-react';

interface Campaign {
  id: string; name: string; isActive: boolean; startDate: string | null;
  endDate: string | null; maxUsesPerUser: number; allowedCategories: string[];
}

interface OfferProduct {
  id: string; name: string; slug: string; price: number; finalPrice: number;
  image: string | null; isBOGOEligible: boolean; bogoCategory: string | null;
  bogoActive: boolean; stockQuantity: number; isActive: boolean;
}

interface Stats {
  campaignActive: boolean; campaignName: string; eligibleNecklaces: number;
  eligibleRings: number; totalEligible: number;
}

const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

export default function OfferCampaignAdminPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [offerOnlyFilter, setOfferOnlyFilter] = useState(false);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [campaignRes, statsRes, productsRes] = await Promise.all([
        api.get('/offer/admin/campaign'),
        api.get('/offer/admin/stats'),
        api.get('/offer/admin/products', {
          params: { search: searchQuery || undefined, offerRole: roleFilter || undefined,
            offerOnly: offerOnlyFilter ? 'true' : undefined, limit: '50' },
        }),
      ]);
      setCampaign(campaignRes.data.data);
      setStats(statsRes.data.data);
      setProducts(productsRes.data.data);
    } catch { /* silently handled */ }
    finally { setLoading(false); }
  }, [searchQuery, roleFilter, offerOnlyFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleToggleCampaign = async () => {
    if (!campaign) return;
    setSaving(true);
    try {
      const res = await api.put('/offer/admin/campaign', { isActive: !campaign.isActive });
      setCampaign(res.data.data);
      showSuccess(campaign.isActive ? 'Campaign deactivated' : 'Campaign activated!');
      fetchAll();
    } finally { setSaving(false); }
  };

  const handleSaveCampaign = async () => {
    if (!campaign) return;
    setSaving(true);
    try {
      const res = await api.put('/offer/admin/campaign', {
        name: campaign.name, startDate: campaign.startDate,
        endDate: campaign.endDate, maxUsesPerUser: campaign.maxUsesPerUser,
      });
      setCampaign(res.data.data);
      showSuccess('Campaign saved');
    } finally { setSaving(false); }
  };

  const handleSetProductRole = async (product: OfferProduct, role: 'necklace' | 'ring' | null) => {
    try {
      const res = await api.put(`/offer/admin/products/${product.id}`, { isEligible: role !== null, offerRole: role });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...res.data.data } : p)));
      showSuccess(role ? `${product.name} set as ${role}` : `${product.name} removed from offer`);
    } catch { /* noop */ }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Offer Campaign</h1>
            <p className="text-neutral-500 text-sm mt-1">Buy Any Necklace — Get a Ring FREE</p>
          </div>
          {successMsg && (
            <span className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </span>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Status', value: stats.campaignActive ? 'ACTIVE' : 'INACTIVE', icon: Zap, color: stats.campaignActive ? 'text-emerald-600' : 'text-neutral-400' },
              { label: 'Necklaces', value: stats.eligibleNecklaces, icon: Tag, color: 'text-[#C6A85B]' },
              { label: 'Rings (Free)', value: stats.eligibleRings, icon: Gift, color: 'text-pink-500' },
              { label: 'Total', value: stats.totalEligible, icon: Package, color: 'text-neutral-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4">
                <Icon className={`w-5 h-5 mb-2 ${color}`} />
                <p className="text-2xl font-semibold text-neutral-900">{value}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {campaign && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-neutral-900">Campaign Settings</h2>
              <button onClick={handleToggleCampaign} disabled={saving}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  campaign.isActive
                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}>
                {campaign.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                {campaign.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Campaign Name</label>
                <input type="text" value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A85B]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Max Uses Per User (0 = unlimited)</label>
                <input type="number" value={campaign.maxUsesPerUser}
                  onChange={(e) => setCampaign({ ...campaign, maxUsesPerUser: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A85B]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Start Date</label>
                <input type="datetime-local" value={campaign.startDate ? campaign.startDate.slice(0, 16) : ''}
                  onChange={(e) => setCampaign({ ...campaign, startDate: e.target.value || null })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A85B]/30" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">End Date</label>
                <input type="datetime-local" value={campaign.endDate ? campaign.endDate.slice(0, 16) : ''}
                  onChange={(e) => setCampaign({ ...campaign, endDate: e.target.value || null })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C6A85B]/30" />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleSaveCampaign} disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C6A85B] text-white rounded-full text-sm font-semibold hover:bg-[#b8985a] transition-colors">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-2">Product Eligibility</h2>
          <p className="text-sm text-neutral-500 mb-4">Set each product as <strong>Necklace</strong> (triggers offer) or <strong>Ring</strong> (free gift).</p>
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" placeholder="Search..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none w-52" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none">
              <option value="">All Roles</option>
              <option value="necklace">Necklaces</option>
              <option value="ring">Rings</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
              <input type="checkbox" checked={offerOnlyFilter} onChange={(e) => setOfferOnlyFilter(e.target.checked)} className="rounded" />
              Offer products only
            </label>
            <button onClick={fetchAll} className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-neutral-50 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-neutral-100">
                  <th className="text-left py-3 px-2 font-medium text-neutral-600">Product</th>
                  <th className="text-left py-3 px-2 font-medium text-neutral-600">Price</th>
                  <th className="text-left py-3 px-2 font-medium text-neutral-600">Stock</th>
                  <th className="text-left py-3 px-2 font-medium text-neutral-600">Role</th>
                  <th className="text-left py-3 px-2 font-medium text-neutral-600">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-50">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-2 font-medium text-neutral-900 line-clamp-1">{p.name}</td>
                      <td className="py-3 px-2 text-neutral-600">{formatINR(p.finalPrice)}</td>
                      <td className="py-3 px-2 text-neutral-600">{p.stockQuantity}</td>
                      <td className="py-3 px-2">
                        {p.isBOGOEligible && p.bogoCategory ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            p.bogoCategory === 'necklace' ? 'bg-[#C6A85B]/10 text-[#C6A85B]' : 'bg-pink-50 text-pink-600'
                          }`}>
                            {p.bogoCategory === 'necklace' ? <Tag className="w-3 h-3" /> : <Gift className="w-3 h-3" />}
                            {p.bogoCategory}
                          </span>
                        ) : <span className="text-neutral-400 text-xs">—</span>}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSetProductRole(p, 'necklace')}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              p.bogoCategory === 'necklace' ? 'bg-[#C6A85B] text-white border-[#C6A85B]' : 'border-neutral-200 text-neutral-600 hover:border-[#C6A85B] hover:text-[#C6A85B]'
                            }`}>Necklace</button>
                          <button onClick={() => handleSetProductRole(p, 'ring')}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              p.bogoCategory === 'ring' ? 'bg-pink-500 text-white border-pink-500' : 'border-neutral-200 text-neutral-600 hover:border-pink-400 hover:text-pink-500'
                            }`}>Ring (Free Gift)</button>
                          {p.isBOGOEligible && (
                            <button onClick={() => handleSetProductRole(p, null)}
                              className="px-3 py-1 rounded-full text-xs font-medium border border-neutral-200 text-red-500 hover:bg-red-50 transition-colors">Remove</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <p className="text-center text-neutral-400 py-8">No products found.</p>}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
