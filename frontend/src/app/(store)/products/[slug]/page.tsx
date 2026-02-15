import ProductDetailClient from '@/components/product/ProductDetailClient';
import type { Metadata } from 'next';

const SITE_URL = 'https://orashop.in';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://oranew.onrender.com/api';

interface ProductImage {
  id: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductMeta {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPercent: number;
  finalPrice: number;
  stockQuantity: number;
  material: string;
  averageRating: number;
  reviewCount: number;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
}

async function getProduct(slug: string): Promise<ProductMeta | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch {
    return null;
  }
}

// ── Dynamic SEO Metadata ──────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for could not be found.',
    };
  }

  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage?.imageUrl || `${SITE_URL}/oralogo.png`;
  const description =
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    `Shop ${product.name} at ORA Jewellery. Premium everyday jewellery.`;

  return {
    title: product.name,
    description,
    keywords: `${product.name}, ${product.category.name}, jewellery, ORA, fashion jewellery, ${product.material || 'premium'}`,
    alternates: {
      canonical: `${SITE_URL}/products/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} — ₹${Number(product.finalPrice).toFixed(0)}`,
      description,
      url: `${SITE_URL}/products/${product.slug}`,
      siteName: 'ORA Jewellery',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: primaryImage?.altText || product.name,
        },
      ],
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} — ₹${Number(product.finalPrice).toFixed(0)}`,
      description,
      images: [imageUrl],
    },
  };
}

// ── JSON-LD Structured Data ───────────────────────────────────────────
function ProductJsonLd({ product }: { product: ProductMeta }) {
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.description,
    image: product.images?.map((img) => img.imageUrl) || [],
    sku: `ORA-${product.id.slice(0, 8).toUpperCase()}`,
    brand: {
      '@type': 'Brand',
      name: 'ORA Jewellery',
    },
    category: product.category.name,
    material: product.material || undefined,
    url: `${SITE_URL}/products/${product.slug}`,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: 'INR',
      price: Number(product.finalPrice).toFixed(2),
      ...(product.discountPercent > 0
        ? { priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }
        : {}),
      availability:
        product.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'ORA Jewellery',
      },
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(product.averageRating).toFixed(1),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ── Server Component Page ─────────────────────────────────────────────
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  return (
    <>
      {product && <ProductJsonLd product={product} />}
      <ProductDetailClient slug={slug} />
    </>
  );
}
