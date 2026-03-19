import TumblersCollectionClient from '@/components/collections/TumblersCollectionClient';
import {
  buildCategoryBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  categoryDescriptionFallback,
  categoryTitleFallback,
  getCategoryProducts,
  toAbsoluteUrl,
} from '@/lib/seo/collectionSeo';
import type { Metadata } from 'next';

const SITE_URL = 'https://orashop.in';
const CATEGORY_SLUG = 'tumblers';

function canonicalUrl(): string {
  return `${SITE_URL}/collections/${CATEGORY_SLUG}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const categoryName = 'Tumblers';
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

export default async function TumblersPage() {
  const listing = await getCategoryProducts({
    slug: CATEGORY_SLUG,
    page: 1,
    limit: 50,
    sortBy: '-createdAt',
    isTumbler: true,
  });

  const resolvedCategory =
    {
      id: 'virtual-tumblers',
      name: 'Tumblers',
      slug: CATEGORY_SLUG,
      description: 'Premium tumblers and mugs by ORA Jewellery.',
    } as const;

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
      <TumblersCollectionClient initialProducts={listing.products} />
    </>
  );
}
