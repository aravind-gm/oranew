import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Any Necklace, Get a Ring FREE — ORA Jewellery',
  description: 'ORA Launch Offer: Purchase any eligible necklace and receive a complimentary ring of your choice, absolutely free. Shop the exclusive collection now.',
  keywords: ['free ring with necklace', 'necklace offer', 'ORA launch offer', 'buy necklace get ring free', 'jewellery gift offer', 'ORA jewellery campaign'],
  openGraph: {
    title: 'Buy Any Necklace, Get a Ring FREE | ORA Jewellery',
    description: 'Purchase any eligible necklace and receive a complimentary ring of your choice. Limited time launch offer.',
    type: 'website',
  },
  alternates: {
    canonical: '/collections/combos',
  },
};

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  return children;
}

