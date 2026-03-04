import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery',
  description: 'Free shipping on orders above ₹499. Learn about ORA Jewellery delivery timelines, shipping partners, and tracking.',
  alternates: { canonical: 'https://orashop.in/shipping' },
  openGraph: {
    title: 'Shipping & Delivery | ORA Jewellery',
    description: 'Fast, free delivery on ORA Jewellery orders across India.',
    url: 'https://orashop.in/shipping',
    siteName: 'ORA Jewellery',
    type: 'website',
  },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
