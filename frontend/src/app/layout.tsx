import AddToCartPopup from '@/components/AddToCartPopup';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import MetaPixel from '@/components/analytics/MetaPixel';
import AuthStateSync from '@/components/AuthStateSync';
import FloatingPetals from '@/components/FloatingPetals';
import PromotionalAds from '@/components/PromotionalAds';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import WomensDayBar from '@/components/WomensDayBar';
import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

// Next.js 14+ requires viewport as a separate export
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://orashop.in'),
  title: {
    default: 'ORA Jewellery | Premium Everyday Jewellery',
    template: '%s | ORA Jewellery',
  },
  description: 'own. radiate. adorn. — Discover ORA\'s curated collection of premium fashion jewellery. Necklaces, bracelets, rings, earrings and more. Everyday luxury under ₹1,500.',
  keywords: 'jewellery, fashion jewellery, premium jewellery, necklaces, earrings, bracelets, rings, ORA, luxury jewellery, Indian jewellery, affordable jewellery',
  icons: {
    icon: '/oralogo.png',
    apple: '/oralogo.png',
  },
  alternates: {
    canonical: 'https://orashop.in',
  },
  openGraph: {
    title: 'ORA Jewellery | Premium Everyday Jewellery',
    description: 'own. radiate. adorn. — Discover curated premium fashion jewellery. Everyday luxury under ₹1,500.',
    url: 'https://orashop.in',
    siteName: 'ORA Jewellery',
    images: [
      {
        url: '/oralogo.png',
        width: 512,
        height: 512,
        alt: 'ORA Jewellery Logo',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ORA Jewellery | Premium Everyday Jewellery',
    description: 'own. radiate. adorn. — Premium fashion jewellery for everyday.',
    images: ['/oralogo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Organization JSON-LD (sitewide)
function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ORA Jewellery',
    url: 'https://orashop.in',
    logo: 'https://orashop.in/oralogo.png',
    description: 'Premium everyday fashion jewellery — own. radiate. adorn.',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// WebSite JSON-LD (for sitelinks searchbox)
function WebSiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ORA Jewellery',
    url: 'https://orashop.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://orashop.in/products?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="smooth-scroll">
      <head>
        <GoogleAnalytics />
        <MetaPixel />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased bg-background text-foreground`}>
        <AuthStateSync />
        <FloatingPetals />
        <WomensDayBar />
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <AddToCartPopup />
        <PromotionalAds />
      </body>
    </html>
  );
}
