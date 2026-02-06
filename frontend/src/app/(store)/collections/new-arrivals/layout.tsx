import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Arrivals | ORA - Latest Jewellery Designs',
  description: "Discover the latest jewellery designs just launched at ORA. Fresh necklaces, rings, bracelets & earrings. Be the first to own our newest pieces.",
  keywords: ['new arrivals', 'new jewellery', 'latest designs', 'ORA new', 'just launched'],
  openGraph: {
    title: 'New Arrivals | ORA',
    description: "Latest designs, just launched. Discover what's new at ORA.",
    type: 'website',
  },
  alternates: {
    canonical: '/collections/new-arrivals',
  },
};

export default function NewArrivalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
