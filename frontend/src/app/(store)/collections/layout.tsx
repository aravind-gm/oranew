import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Jewellery | ORA - Everyday Luxury Under ₹1,500',
  description: "Explore ORA's complete collection of necklaces, rings, bracelets, and earrings. Premium Indian jewellery designed for the modern woman. Affordable luxury under ₹1,500.",
  keywords: ['ORA jewellery', 'all jewellery', 'necklaces', 'rings', 'bracelets', 'affordable luxury', 'Indian jewellery'],
  openGraph: {
    title: 'All Jewellery | ORA',
    description: 'Explore our complete collection. Everyday luxury under ₹1,500.',
    type: 'website',
  },
  alternates: {
    canonical: '/collections',
  },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
