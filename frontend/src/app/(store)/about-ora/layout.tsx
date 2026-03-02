import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About ORA — Wear Your Aura',
  description:
    'Discover the story behind ORA Jewellery. Contemporary fashion jewellery designed for the modern woman who already shines. Minimal. Powerful. Intentional.',
  alternates: {
    canonical: 'https://orashop.in/about-ora',
  },
  openGraph: {
    title: 'About ORA — Wear Your Aura',
    description:
      'Jewellery designed for the woman who already shines. Discover our philosophy, our manifesto, and the story behind ORA.',
    url: 'https://orashop.in/about-ora',
    siteName: 'ORA Jewellery',
    type: 'website',
    images: [{ url: 'https://orashop.in/oralogo.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About ORA — Wear Your Aura',
    description:
      'Contemporary jewellery for the modern woman. Minimal. Powerful. Intentional.',
    images: ['https://orashop.in/oralogo.png'],
  },
};

export default function AboutOraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
