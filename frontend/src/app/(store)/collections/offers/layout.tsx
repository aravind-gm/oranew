import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offers | ORA - Limited-Time Savings on Selected Designs',
  description: "Shop ORA's offers - limited-time savings on selected jewellery designs. Premium quality at special prices. Don't miss out on these curated deals.",
  keywords: ['offers', 'jewellery offers', 'discounts', 'sale', 'ORA offers', 'limited time', 'savings'],
  openGraph: {
    title: 'Offers | ORA',
    description: 'Limited-time savings on selected designs. Premium jewellery at special prices.',
    type: 'website',
  },
  alternates: {
    canonical: '/collections/offers',
  },
};

export default function OffersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
