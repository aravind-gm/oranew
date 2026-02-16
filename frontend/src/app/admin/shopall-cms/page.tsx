'use client';

/**
 * Admin — Shop All Page CMS
 * 
 * Full admin control for the Shop All / All Jewellery page.
 * Manage: Hero, Promise Strip, Mood Strip, Promo Banners,
 * Highlighted Collections, Emotional Pause, Trust CTA, Product Grid.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import {
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Image as ImageIcon,
  Type,
  Link as LinkIcon,
  Settings,
  LayoutGrid,
  Sparkles,
  Heart,
  Gift,
  Shield,
  RefreshCw,
  Truck,
  Star,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

// ============================================================================
// Types (matches backend CMS config)
// ============================================================================

interface HeroConfig {
  enabled: boolean;
  heading: string;
  subheading: string;
  ctaText: string;
  ctaLink: string;
  desktopImage: string;
  mobileImage: string;
  videoUrl: string;
  overlayOpacity: number;
}

interface PromiseItem {
  id: string;
  icon: string;
  text: string;
  enabled: boolean;
}

interface MoodItem {
  id: string;
  title: string;
  image: string;
  filterOrLink: string;
  type: 'link' | 'filter';
}

interface PromoBanner {
  id: string;
  image: string;
  title: string;
  link: string;
  enabled: boolean;
}

interface HighlightItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  link: string;
}

interface EmotionalPauseConfig {
  enabled: boolean;
  text: string;
  ctaText: string;
  ctaLink: string;
}

interface TrustCtaConfig {
  enabled: boolean;
  items: Array<{ id: string; icon: string; text: string }>;
  ctaText: string;
  ctaLink: string;
}

interface ProductGridConfig {
  defaultSort: string;
  productsPerPage: number;
  loadMoreStyle: 'button' | 'infinite';
}

interface ShopAllConfig {
  hero: HeroConfig;
  promiseStrip: { enabled: boolean; items: PromiseItem[] };
  moodStrip: { enabled: boolean; items: MoodItem[] };
  promoBanners: { enabled: boolean; insertAfterEvery: number; banners: PromoBanner[] };
  highlightedCollections: { enabled: boolean; heading: string; items: HighlightItem[] };
  emotionalPause: EmotionalPauseConfig;
  trustCta: TrustCtaConfig;
  productGrid: ProductGridConfig;
}

// ============================================================================
// Icon options for select dropdowns
// ============================================================================

const ICON_OPTIONS = [
  { value: 'gift', label: 'Gift' },
  { value: 'truck', label: 'Truck' },
  { value: 'refresh', label: 'Refresh/Returns' },
  { value: 'heart', label: 'Heart' },
  { value: 'shield', label: 'Shield' },
  { value: 'star', label: 'Star' },
  { value: 'package', label: 'Package' },
  { value: 'sparkles', label: 'Sparkles' },
];

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price Low-High' },
  { value: 'price_desc', label: 'Price High-Low' },
];

// ============================================================================
// Reusable admin UI components
// ============================================================================

function SectionCard({
  title,
  icon: Icon,
  enabled,
  onToggle,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  enabled: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 text-left flex-1"
        >
          <Icon size={18} className="text-amber-400" />
          <span className="font-medium text-white">{title}</span>
          {open ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            enabled
              ? 'bg-green-900/50 text-green-400 hover:bg-green-900/70'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
          {enabled ? 'Visible' : 'Hidden'}
        </button>
      </div>
      {open && (
        <div className="p-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  type?: string;
  value: string | number;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-900 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 outline-none transition-colors ${
            Icon ? 'pl-9 pr-3 py-2.5' : 'px-3 py-2.5'
          }`}
        />
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-900 border border-gray-600 rounded-lg text-sm text-white px-3 py-2.5 focus:border-amber-500 outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

// ============================================================================
// MAIN ADMIN PAGE
// ============================================================================

export default function ShopAllCmsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [config, setConfig] = useState<ShopAllConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auth check
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.replace('/admin/login');
    }
  }, [user, router]);

  // Fetch config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/shopall-cms');
        if (res.data?.success) {
          setConfig(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load Shop All CMS config:', err);
        showToast('Failed to load config', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Save config
  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.put('/shopall-cms', config);
      showToast('Shop All page config saved!', 'success');
    } catch (err) {
      console.error('Failed to save config:', err);
      showToast('Failed to save. Check console.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Update helpers
  const updateHero = (field: keyof HeroConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, hero: { ...config.hero, [field]: value } });
  };

  const updatePromiseItem = (index: number, field: keyof PromiseItem, value: any) => {
    if (!config) return;
    const items = [...config.promiseStrip.items];
    items[index] = { ...items[index], [field]: value };
    setConfig({ ...config, promiseStrip: { ...config.promiseStrip, items } });
  };

  const addPromiseItem = () => {
    if (!config) return;
    const newItem: PromiseItem = {
      id: String(Date.now()),
      icon: 'heart',
      text: 'New Promise',
      enabled: true,
    };
    setConfig({
      ...config,
      promiseStrip: { ...config.promiseStrip, items: [...config.promiseStrip.items, newItem] },
    });
  };

  const removePromiseItem = (index: number) => {
    if (!config) return;
    const items = config.promiseStrip.items.filter((_, i) => i !== index);
    setConfig({ ...config, promiseStrip: { ...config.promiseStrip, items } });
  };

  const updateMoodItem = (index: number, field: keyof MoodItem, value: any) => {
    if (!config) return;
    const items = [...config.moodStrip.items];
    items[index] = { ...items[index], [field]: value };
    setConfig({ ...config, moodStrip: { ...config.moodStrip, items } });
  };

  const addMoodItem = () => {
    if (!config) return;
    const newItem: MoodItem = {
      id: String(Date.now()),
      title: 'New Mood',
      image: '',
      filterOrLink: '/collections',
      type: 'link',
    };
    setConfig({
      ...config,
      moodStrip: { ...config.moodStrip, items: [...config.moodStrip.items, newItem] },
    });
  };

  const removeMoodItem = (index: number) => {
    if (!config) return;
    const items = config.moodStrip.items.filter((_, i) => i !== index);
    setConfig({ ...config, moodStrip: { ...config.moodStrip, items } });
  };

  const updatePromoBanner = (index: number, field: keyof PromoBanner, value: any) => {
    if (!config) return;
    const banners = [...config.promoBanners.banners];
    banners[index] = { ...banners[index], [field]: value };
    setConfig({ ...config, promoBanners: { ...config.promoBanners, banners } });
  };

  const addPromoBanner = () => {
    if (!config) return;
    const newBanner: PromoBanner = {
      id: String(Date.now()),
      image: '',
      title: 'New Promo Banner',
      link: '/collections',
      enabled: true,
    };
    setConfig({
      ...config,
      promoBanners: { ...config.promoBanners, banners: [...config.promoBanners.banners, newBanner] },
    });
  };

  const removePromoBanner = (index: number) => {
    if (!config) return;
    const banners = config.promoBanners.banners.filter((_, i) => i !== index);
    setConfig({ ...config, promoBanners: { ...config.promoBanners, banners } });
  };

  const updateHighlightItem = (index: number, field: keyof HighlightItem, value: any) => {
    if (!config) return;
    const items = [...config.highlightedCollections.items];
    items[index] = { ...items[index], [field]: value };
    setConfig({ ...config, highlightedCollections: { ...config.highlightedCollections, items } });
  };

  const addHighlightItem = () => {
    if (!config) return;
    const newItem: HighlightItem = {
      id: String(Date.now()),
      title: 'New Category',
      subtitle: 'Description here',
      image: '',
      ctaText: 'Explore',
      link: '/collections',
    };
    setConfig({
      ...config,
      highlightedCollections: { ...config.highlightedCollections, items: [...config.highlightedCollections.items, newItem] },
    });
  };

  const removeHighlightItem = (index: number) => {
    if (!config) return;
    const items = config.highlightedCollections.items.filter((_, i) => i !== index);
    setConfig({ ...config, highlightedCollections: { ...config.highlightedCollections, items } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <p>Failed to load configuration. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-700">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-semibold">Shop All Page CMS</h1>
              <p className="text-xs text-gray-400">Manage /collections page sections</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/collections"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-medium text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Preview Page ↗
            </a>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== SECTIONS ===== */}
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-5">

        {/* ────── 1. HERO ────── */}
        <SectionCard
          title="Hero Banner"
          icon={ImageIcon}
          enabled={config.hero.enabled}
          onToggle={() => updateHero('enabled', !config.hero.enabled)}
          defaultOpen
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Heading" value={config.hero.heading} onChange={(v) => updateHero('heading', v)} icon={Type} />
            <Field label="CTA Button Text" value={config.hero.ctaText} onChange={(v) => updateHero('ctaText', v)} />
          </div>
          <Field label="Subheading" value={config.hero.subheading} onChange={(v) => updateHero('subheading', v)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Desktop Image URL" value={config.hero.desktopImage} onChange={(v) => updateHero('desktopImage', v)} icon={ImageIcon} placeholder="https://..." />
            <Field label="Mobile Image URL" value={config.hero.mobileImage} onChange={(v) => updateHero('mobileImage', v)} icon={ImageIcon} placeholder="https://..." />
          </div>
          <Field label="Video URL (optional)" value={config.hero.videoUrl} onChange={(v) => updateHero('videoUrl', v)} placeholder="https://..." />
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Overlay Opacity: {config.hero.overlayOpacity}
            </label>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={config.hero.overlayOpacity}
              onChange={(e) => updateHero('overlayOpacity', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </SectionCard>

        {/* ────── 2. PROMISE STRIP ────── */}
        <SectionCard
          title="Promise Strip"
          icon={Gift}
          enabled={config.promiseStrip.enabled}
          onToggle={() => setConfig({ ...config, promiseStrip: { ...config.promiseStrip, enabled: !config.promiseStrip.enabled } })}
        >
          {config.promiseStrip.items.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SelectField label="Icon" value={item.icon} onChange={(v) => updatePromiseItem(i, 'icon', v)} options={ICON_OPTIONS} />
                <div className="sm:col-span-2">
                  <Field label="Text" value={item.text} onChange={(v) => updatePromiseItem(i, 'text', v)} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => updatePromiseItem(i, 'enabled', !item.enabled)}
                  className={`p-1.5 rounded ${item.enabled ? 'text-green-400' : 'text-gray-500'}`}
                >
                  {item.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => removePromiseItem(i)} className="p-1.5 rounded text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <button onClick={addPromiseItem} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300">
            <Plus size={14} /> Add Item
          </button>
        </SectionCard>

        {/* ────── 3. MOOD / STORY STRIP ────── */}
        <SectionCard
          title="Shop by Mood Strip"
          icon={Sparkles}
          enabled={config.moodStrip.enabled}
          onToggle={() => setConfig({ ...config, moodStrip: { ...config.moodStrip, enabled: !config.moodStrip.enabled } })}
        >
          {config.moodStrip.items.map((item, i) => (
            <div key={item.id} className="p-3 bg-gray-900 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-400 font-medium">Mood Card #{i + 1}</span>
                <button onClick={() => removeMoodItem(i)} className="p-1 text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Title" value={item.title} onChange={(v) => updateMoodItem(i, 'title', v)} icon={Type} />
                <Field label="Image URL" value={item.image} onChange={(v) => updateMoodItem(i, 'image', v)} icon={ImageIcon} placeholder="https://..." />
              </div>
              <Field label="Link / Filter URL" value={item.filterOrLink} onChange={(v) => updateMoodItem(i, 'filterOrLink', v)} icon={LinkIcon} placeholder="/collections?maxPrice=1099" />
            </div>
          ))}
          <button onClick={addMoodItem} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300">
            <Plus size={14} /> Add Mood Card
          </button>
        </SectionCard>

        {/* ────── 4. PROMO BANNERS ────── */}
        <SectionCard
          title="Promo Banners (Between Products)"
          icon={LayoutGrid}
          enabled={config.promoBanners.enabled}
          onToggle={() => setConfig({ ...config, promoBanners: { ...config.promoBanners, enabled: !config.promoBanners.enabled } })}
        >
          <Field
            label="Insert banner after every N products"
            type="number"
            value={config.promoBanners.insertAfterEvery}
            onChange={(v) => setConfig({ ...config, promoBanners: { ...config.promoBanners, insertAfterEvery: parseInt(v) || 8 } })}
          />
          {config.promoBanners.banners.map((banner, i) => (
            <div key={banner.id} className="p-3 bg-gray-900 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-400 font-medium">Banner #{i + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updatePromoBanner(i, 'enabled', !banner.enabled)}
                    className={`p-1.5 rounded ${banner.enabled ? 'text-green-400' : 'text-gray-500'}`}
                  >
                    {banner.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => removePromoBanner(i)} className="p-1 text-red-400 hover:text-red-300">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <Field label="Title" value={banner.title} onChange={(v) => updatePromoBanner(i, 'title', v)} icon={Type} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Image URL" value={banner.image} onChange={(v) => updatePromoBanner(i, 'image', v)} icon={ImageIcon} placeholder="https://..." />
                <Field label="Link" value={banner.link} onChange={(v) => updatePromoBanner(i, 'link', v)} icon={LinkIcon} />
              </div>
            </div>
          ))}
          <button onClick={addPromoBanner} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300">
            <Plus size={14} /> Add Promo Banner
          </button>
        </SectionCard>

        {/* ────── 5. HIGHLIGHTED COLLECTIONS ────── */}
        <SectionCard
          title="Highlighted Collections"
          icon={LayoutGrid}
          enabled={config.highlightedCollections.enabled}
          onToggle={() => setConfig({ ...config, highlightedCollections: { ...config.highlightedCollections, enabled: !config.highlightedCollections.enabled } })}
        >
          <Field
            label="Section Heading"
            value={config.highlightedCollections.heading}
            onChange={(v) => setConfig({ ...config, highlightedCollections: { ...config.highlightedCollections, heading: v } })}
            icon={Type}
          />
          {config.highlightedCollections.items.map((item, i) => (
            <div key={item.id} className="p-3 bg-gray-900 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs text-gray-400 font-medium">Card #{i + 1}</span>
                <button onClick={() => removeHighlightItem(i)} className="p-1 text-red-400 hover:text-red-300">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Title" value={item.title} onChange={(v) => updateHighlightItem(i, 'title', v)} icon={Type} />
                <Field label="Subtitle" value={item.subtitle} onChange={(v) => updateHighlightItem(i, 'subtitle', v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Image URL" value={item.image} onChange={(v) => updateHighlightItem(i, 'image', v)} icon={ImageIcon} placeholder="https://..." />
                <Field label="CTA Text" value={item.ctaText} onChange={(v) => updateHighlightItem(i, 'ctaText', v)} />
                <Field label="Link" value={item.link} onChange={(v) => updateHighlightItem(i, 'link', v)} icon={LinkIcon} />
              </div>
            </div>
          ))}
          <button onClick={addHighlightItem} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300">
            <Plus size={14} /> Add Collection Card
          </button>
        </SectionCard>

        {/* ────── 6. EMOTIONAL PAUSE ────── */}
        <SectionCard
          title="Emotional Pause"
          icon={Heart}
          enabled={config.emotionalPause.enabled}
          onToggle={() => setConfig({ ...config, emotionalPause: { ...config.emotionalPause, enabled: !config.emotionalPause.enabled } })}
        >
          <Field
            label="Quote Text"
            value={config.emotionalPause.text}
            onChange={(v) => setConfig({ ...config, emotionalPause: { ...config.emotionalPause, text: v } })}
            icon={Type}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="CTA Text"
              value={config.emotionalPause.ctaText}
              onChange={(v) => setConfig({ ...config, emotionalPause: { ...config.emotionalPause, ctaText: v } })}
            />
            <Field
              label="CTA Link"
              value={config.emotionalPause.ctaLink}
              onChange={(v) => setConfig({ ...config, emotionalPause: { ...config.emotionalPause, ctaLink: v } })}
              icon={LinkIcon}
            />
          </div>
        </SectionCard>

        {/* ────── 7. TRUST CTA ────── */}
        <SectionCard
          title="Final Trust & CTA Strip"
          icon={Shield}
          enabled={config.trustCta.enabled}
          onToggle={() => setConfig({ ...config, trustCta: { ...config.trustCta, enabled: !config.trustCta.enabled } })}
        >
          {config.trustCta.items.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SelectField
                  label="Icon"
                  value={item.icon}
                  onChange={(v) => {
                    const items = [...config.trustCta.items];
                    items[i] = { ...items[i], icon: v };
                    setConfig({ ...config, trustCta: { ...config.trustCta, items } });
                  }}
                  options={ICON_OPTIONS}
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Text"
                    value={item.text}
                    onChange={(v) => {
                      const items = [...config.trustCta.items];
                      items[i] = { ...items[i], text: v };
                      setConfig({ ...config, trustCta: { ...config.trustCta, items } });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
            <Field
              label="CTA Button Text"
              value={config.trustCta.ctaText}
              onChange={(v) => setConfig({ ...config, trustCta: { ...config.trustCta, ctaText: v } })}
            />
            <Field
              label="CTA Link"
              value={config.trustCta.ctaLink}
              onChange={(v) => setConfig({ ...config, trustCta: { ...config.trustCta, ctaLink: v } })}
              icon={LinkIcon}
            />
          </div>
        </SectionCard>

        {/* ────── 8. PRODUCT GRID SETTINGS ────── */}
        <SectionCard
          title="Product Grid Settings"
          icon={Settings}
          enabled={true}
          onToggle={() => {}}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField
              label="Default Sort"
              value={config.productGrid.defaultSort}
              onChange={(v) => setConfig({ ...config, productGrid: { ...config.productGrid, defaultSort: v } })}
              options={SORT_OPTIONS}
            />
            <Field
              label="Products Per Page"
              type="number"
              value={config.productGrid.productsPerPage}
              onChange={(v) => setConfig({ ...config, productGrid: { ...config.productGrid, productsPerPage: parseInt(v) || 24 } })}
            />
            <SelectField
              label="Load More Style"
              value={config.productGrid.loadMoreStyle}
              onChange={(v) => setConfig({ ...config, productGrid: { ...config.productGrid, loadMoreStyle: v as 'button' | 'infinite' } })}
              options={[
                { value: 'button', label: 'Load More Button' },
                { value: 'infinite', label: 'Infinite Scroll' },
              ]}
            />
          </div>
        </SectionCard>

        {/* ===== SAVE BUTTON (BOTTOM) ===== */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 text-sm font-medium bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
