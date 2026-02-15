import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - Get in Touch with ORA',
  description: 'Contact ORA Jewellery for customer support, order inquiries, or product questions. Email, phone, or message us anytime.',
  alternates: {
    canonical: 'https://orashop.in/contact',
  },
  openGraph: {
    title: 'Contact Us - ORA Jewellery',
    description: 'Get in touch with ORA Jewellery for any queries or support.',
    url: 'https://orashop.in/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us - ORA Jewellery',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
