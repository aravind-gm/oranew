import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Combos for Her — Buy 1 Get 1 Free | ORA Jewellery',
  description: "Buy 1 Get 1 Free on curated jewellery combos. Perfectly paired necklaces, earrings & bracelets — crafted for gifting, celebrating, and glowing.",
  keywords: ['jewellery combos', 'buy 1 get 1 free', 'BOGO jewellery', 'jewellery gift sets', 'combo offers', 'ORA combos', 'gift for her', 'jewellery bundles'],
  openGraph: {
    title: 'Buy 1 Get 1 Free — Combos for Her | ORA',
    description: 'Curated jewellery combos crafted for gifting, celebrating, and glowing. 2 pieces at 1 price.',
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
