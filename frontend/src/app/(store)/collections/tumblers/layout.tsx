import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tumblers | ORA - Designed for Everyday Elegance',
  description: "ORA's premium tumbler collection. Beautifully designed tumblers for everyday elegance. The perfect drinkware companion, crafted with care.",
  keywords: ['tumblers', 'ORA tumblers', 'premium tumblers', 'drinkware', 'everyday elegance'],
  openGraph: {
    title: 'Tumblers | ORA',
    description: 'Designed for everyday elegance. Premium tumblers by ORA.',
    type: 'website',
  },
  alternates: {
    canonical: '/collections/tumblers',
  },
};

export default function TumblersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
