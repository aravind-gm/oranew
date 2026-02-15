import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs - Frequently Asked Questions',
  description: 'Find answers to common questions about ORA Jewellery products, shipping, returns, payments, and more. Quick help for all your queries.',
  alternates: {
    canonical: 'https://orashop.in/faq',
  },
  openGraph: {
    title: 'FAQs - ORA Jewellery',
    description: 'Find answers to all your questions about ORA Jewellery.',
    url: 'https://orashop.in/faq',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'FAQs - ORA Jewellery',
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
