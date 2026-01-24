import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections | ORA Jewellery — Everyday Luxury Under ₹1,500',
  description: 'Explore our curated collections of necklaces, rings, and bracelets. Premium Indian jewellery designed for the modern woman. Affordable luxury under ₹1,500.',
  keywords: ['ORA jewellery', 'necklaces', 'rings', 'bracelets', 'affordable luxury', 'Indian jewellery'],
  openGraph: {
    title: 'Collections | ORA Jewellery',
    description: 'Everyday luxury under ₹1,500. Explore necklaces, rings & bracelets.',
    type: 'website',
  },
};

export default function CollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
