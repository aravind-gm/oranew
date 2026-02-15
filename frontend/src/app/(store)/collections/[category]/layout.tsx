import { Metadata } from 'next';

const SITE_URL = 'https://orashop.in';

// Helper function to format category name
function formatCategoryTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Generate dynamic metadata for category collections
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryTitle = formatCategoryTitle(category);

  return {
    title: `${categoryTitle} Collection - Premium Jewellery`,
    description: `Shop ${categoryTitle.toLowerCase()} jewellery at ORA. Premium everyday jewellery pieces under ₹1,500. Free delivery across India.`,
    alternates: {
      canonical: `${SITE_URL}/collections/${category}`, // No query strings
    },
    openGraph: {
      title: `${categoryTitle} Collection - ORA Jewellery`,
      description: `Explore our curated ${categoryTitle.toLowerCase()} collection.`,
      url: `${SITE_URL}/collections/${category}`,
      siteName: 'ORA Jewellery',
      type: 'website',
      images: [{ url: `${SITE_URL}/oralogo.png` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryTitle} - ORA Jewellery`,
      description: `Explore our ${categoryTitle.toLowerCase()} collection.`,
      images: [`${SITE_URL}/oralogo.png`],
    },
  };
}

export default function CategoryCollectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
