import AddToCartPopup from '@/components/AddToCartPopup';
import AuthStateSync from '@/components/AuthStateSync';
import PromotionalAds from '@/components/PromotionalAds';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { AuthProvider } from '@/context/AuthContext';
import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'ORA Jewellery | Premium Everyday Jewellery',
  description: 'own. radiate. adorn. — Discover ORA\'s curated collection of premium fashion jewellery. Necklaces, bracelets, rings, earrings and more. Everyday luxury under ₹1,500.',
  keywords: 'jewellery, fashion jewellery, premium jewellery, necklaces, earrings, bracelets, rings, ORA, luxury jewellery, Indian jewellery',
  icons: {
    icon: '/oralogo.png',
    apple: '/oralogo.png',
  },
  openGraph: {
    title: 'ORA Jewellery',
    description: 'own. radiate. adorn.',
    images: ['/oralogo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en" className="smooth-scroll">
        <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased bg-background text-foreground`}>
          <AuthStateSync />
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <AddToCartPopup />
          <PromotionalAds />
        </body>
      </html>
    </AuthProvider>
  );
}
