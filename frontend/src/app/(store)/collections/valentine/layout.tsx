import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Valentine's Collection | ORA - Crafted to Celebrate Love",
  description: "ORA's Valentine's collection - jewellery crafted to celebrate love. Curated necklaces, rings & bracelets perfect for Valentine's Day. Express your love beautifully.",
  keywords: ['valentine gifts', 'valentine jewellery', 'love jewellery', 'valentine collection', 'ORA valentine', 'gifts for valentine'],
  openGraph: {
    title: "Valentine's Collection | ORA",
    description: "Crafted to celebrate love. Curated jewellery for Valentine's Day.",
    type: 'website',
  },
  alternates: {
    canonical: '/collections/valentine',
  },
};

export default function ValentineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
