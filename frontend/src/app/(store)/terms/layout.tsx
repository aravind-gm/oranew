import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using ORA Jewellery online store. Read about our policies and guidelines.',
  alternates: { canonical: 'https://orashop.in/terms' },
  openGraph: {
    title: 'Terms of Service | ORA Jewellery',
    description: 'ORA Jewellery terms and conditions.',
    url: 'https://orashop.in/terms',
    siteName: 'ORA Jewellery',
    type: 'website',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
