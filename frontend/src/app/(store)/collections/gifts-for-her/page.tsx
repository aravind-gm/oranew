import GiftsForHerCollectionClient from '@/components/collections/GiftsForHerCollectionClient';
import {
  buildCategoryBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  categoryDescriptionFallback,
  categoryTitleFallback,
  getCategoryProducts,
  toAbsoluteUrl,
} from '@/lib/seo/collectionSeo';
import type { GiftProduct } from '@/components/gifts/GiftProductCard';
import type { Metadata } from 'next';

const SITE_URL = 'https://orashop.in';
const CATEGORY_SLUG = 'gifts-for-her';

interface Props {
  searchParams: Promise<{
    page?: string;
    occasion?: string;
    maxPrice?: string;
  }>;
}

function canonicalUrl(): string {
  return `${SITE_URL}/collections/${CATEGORY_SLUG}`;
}

function mapToGiftProducts(items: Awaited<ReturnType<typeof getCategoryProducts>>['products']): GiftProduct[] {
  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    price: Number(item.finalPrice || item.price || 0),
    originalPrice: Number(item.price || item.finalPrice || 0),
    images: [item.primaryImage?.imageUrl || '/oralogo.png'],
    rating: Number(item.averageRating || item.rating || 0) || undefined,
    reviewCount: Number(item.reviewCount || 0),
    inStock: item.inStock !== false,
    stockCount: Number(item.stockQuantity || 0),
    giftWrapAvailable: true,
  }));
}

export async function generateMetadata(): Promise<Metadata> {
  const categoryName = 'Gifts For Her';
  const title = categoryTitleFallback(categoryName);
  const description = categoryDescriptionFallback(categoryName);
  const canonical = canonicalUrl();
  const image = toAbsoluteUrl('/oralogo.png');

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'ORA Jewellery',
      type: 'website',
      locale: 'en_IN',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: categoryName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function GiftsForHerPage({ searchParams }: Props) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page || '1') || 1);

  const listing = await getCategoryProducts({
    slug: CATEGORY_SLUG,
    page,
    limit: 12,
    sortBy: '-createdAt',
  });

  const resolvedCategory =
    ({
      id: 'virtual-gifts-for-her',
      name: 'Gifts For Her',
      slug: CATEGORY_SLUG,
      description: 'Curated jewellery gift ideas for her by ORA Jewellery.',
    } as const);

  const canonical = canonicalUrl();

  const collectionSchema = buildCollectionPageJsonLd({
    category: resolvedCategory,
    products: listing.products,
    canonicalUrl: canonical,
  });

  const breadcrumbSchema = buildCategoryBreadcrumbJsonLd({
    category: resolvedCategory,
    canonicalUrl: canonical,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <GiftsForHerCollectionClient
        initialProducts={mapToGiftProducts(listing.products)}
        initialPage={listing.pagination.page || page}
        initialTotalPages={listing.pagination.pages || 1}
        initialOccasion={query.occasion || null}
        initialMaxPrice={query.maxPrice ? Number(query.maxPrice) : null}
      />
    </>
  );
}
