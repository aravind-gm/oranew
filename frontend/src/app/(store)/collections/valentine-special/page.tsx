import api from '@/lib/api';
import {
  BrandManifesto,
  FeaturedPicks,
  FinalValentineCTA,
  GiftByMood,
  InfiniteProductCarousel,
  TrustStrip,
  ValentineCombos,
  ValentineHero,
  ValentineTumblers,
  VideoReelStrip,
} from '@/components/valentine';

export const metadata = {
  title: 'Valentine\u2019s Special | ORA \u2014 Jewellery & Lifestyle Gifts for Her',
  description:
    'Discover ORA\u2019s curated Valentine\u2019s Special \u2014 premium jewellery, Stanley tumblers, and gift combos designed for women who love boldly.',
  openGraph: {
    title: 'Valentine\u2019s Special | ORA',
    description: 'Premium jewellery & lifestyle gifts designed for women.',
    images: [{ url: '/valentine-banner.svg', width: 1200, height: 630 }],
  },
};

/* ─── Types ─── */
interface ProductImage {
  id?: string;
  imageUrl: string;
  isPrimary?: boolean;
  altText?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  finalPrice: number;
  price: number;
  discountPercent?: number;
  averageRating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestseller?: boolean;
  material?: string;
  category?: string;
  images: ProductImage[];
  stockQuantity?: number;
  description?: string;
}

/* ─── Helpers ─── */
function extractProducts(data: unknown): Product[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as Record<string, unknown>;
  if (d.products && Array.isArray(d.products)) return d.products;
  if (d.data) {
    if (Array.isArray(d.data)) return d.data;
    const nested = d.data as Record<string, unknown>;
    if (nested.products && Array.isArray(nested.products)) return nested.products;
  }
  return [];
}

/* ─── Data fetchers ─── */
async function fetchValentineProducts(): Promise<Product[]> {
  try {
    const res = await api.get('/api/products/collection/valentine-special');
    return extractProducts(res.data);
  } catch {
    try {
      const res = await api.get('/api/products', {
        params: { limit: 40, collection: 'valentine-special' },
      });
      return extractProducts(res.data);
    } catch {
      return [];
    }
  }
}

async function fetchCombos(): Promise<Product[]> {
  try {
    const res = await api.get('/api/products/collection/combos');
    return extractProducts(res.data);
  } catch {
    try {
      const res = await api.get('/api/products', {
        params: { category: 'combos', limit: 6 },
      });
      return extractProducts(res.data);
    } catch {
      return [];
    }
  }
}

async function fetchTumblers(): Promise<Product[]> {
  try {
    const res = await api.get('/api/products/collection/tumblers');
    return extractProducts(res.data);
  } catch {
    try {
      const res = await api.get('/api/products', {
        params: { category: 'tumblers', limit: 8 },
      });
      return extractProducts(res.data);
    } catch {
      return [];
    }
  }
}

/* ─── Page Component ─── */
export default async function ValentineSpecialPage() {
  // Parallel data fetching
  const [valentineProducts, combos, tumblers] = await Promise.all([
    fetchValentineProducts(),
    fetchCombos(),
    fetchTumblers(),
  ]);

  // Featured picks: bestsellers or first 6 products (mix jewellery + tumblers)
  const featuredPicks = [
    ...valentineProducts.filter((p) => p.isBestseller).slice(0, 4),
    ...tumblers.filter((p) => p.isBestseller).slice(0, 2),
  ];
  // If not enough bestsellers, pad with newest
  const remaining = 6 - featuredPicks.length;
  if (remaining > 0) {
    const used = new Set(featuredPicks.map((p) => p.id));
    const extras = [...valentineProducts, ...tumblers]
      .filter((p) => !used.has(p.id))
      .slice(0, remaining);
    featuredPicks.push(...extras);
  }

  // Endless carousel: mix all products
  const carouselProducts = [...valentineProducts, ...tumblers].slice(0, 20);

  return (
    <main className="bg-white min-h-screen">
      {/* ───────────── 1. Cinematic Hero ───────────── */}
      <ValentineHero />

      {/* ───────────── 2. Brand Manifesto ───────────── */}
      <BrandManifesto />

      {/* ───────────── 3. Featured Valentine Picks ───────────── */}
      <FeaturedPicks
        products={featuredPicks}
        loading={false}
      />

      {/* ───────────── 4. Valentine Tumblers ───────────── */}
      <ValentineTumblers
        products={tumblers}
        loading={false}
      />

      {/* ───────────── 5. Gift by Mood ───────────── */}
      <GiftByMood />

      {/* ───────────── 6. Valentine Combos ───────────── */}
      <ValentineCombos
        products={combos}
        fallbackProducts={valentineProducts.slice(0, 3)}
        loading={false}
      />

      {/* ───────────── 7. Video Reel Strip ───────────── */}
      <VideoReelStrip />

      {/* ───────────── 8. Endless Picks Carousel ───────────── */}
      <InfiniteProductCarousel
        products={carouselProducts}
        speed={0.6}
      />

      {/* ───────────── 9. Final CTA ───────────── */}
      <FinalValentineCTA />

      {/* ───────────── 10. Trust + Community ───────────── */}
      <TrustStrip />
    </main>
  );
}
