import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Arrivals & Curated Jewellery | ORA - Fresh Drops Every Week',
  description:
    "Discover ORA's latest jewellery drops — necklaces, earrings, rings & bracelets. Premium everyday jewellery designed for the modern woman. New arrivals updated weekly.",
  keywords: [
    'new jewellery',
    'new arrivals',
    'ORA jewellery',
    'latest necklaces',
    'fashion jewellery India',
    'affordable luxury jewellery',
    'trending jewellery',
  ],
  openGraph: {
    title: 'New Arrivals | ORA Jewellery',
    description: 'Fresh drops every week. Everyday luxury under ₹1,500.',
    type: 'website',
  },
  alternates: {
    canonical: '/products',
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
