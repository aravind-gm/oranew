import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Exchange Policy',
  description: 'Easy 5-day returns and exchanges on ORA Jewellery. Learn about our hassle-free return process.',
  alternates: { canonical: 'https://orashop.in/returns' },
  openGraph: {
    title: 'Returns & Exchange | ORA Jewellery',
    description: 'Hassle-free returns and exchanges at ORA Jewellery.',
    url: 'https://orashop.in/returns',
    siteName: 'ORA Jewellery',
    type: 'website',
  },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
