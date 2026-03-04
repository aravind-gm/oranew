import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ORA Jewellery privacy policy. Learn how we collect, use, and protect your personal information.',
  alternates: { canonical: 'https://orashop.in/privacy' },
  openGraph: {
    title: 'Privacy Policy | ORA Jewellery',
    description: 'How ORA Jewellery handles your data and privacy.',
    url: 'https://orashop.in/privacy',
    siteName: 'ORA Jewellery',
    type: 'website',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
