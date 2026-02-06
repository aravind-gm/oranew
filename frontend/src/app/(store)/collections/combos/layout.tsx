import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Combos for Her | ORA - Perfectly Paired Jewellery Sets',
  description: "Save more with ORA's curated jewellery combos. Perfectly paired necklaces, rings & bracelets - designed to go together. Better together, better value.",
  keywords: ['jewellery combos', 'combo sets', 'paired jewellery', 'jewellery sets', 'ORA combos', 'save more'],
  openGraph: {
    title: 'Combos for Her | ORA',
    description: 'Perfectly paired, better together. Curated jewellery combos.',
    type: 'website',
  },
  alternates: {
    canonical: '/collections/combos',
  },
};

export default function CombosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
