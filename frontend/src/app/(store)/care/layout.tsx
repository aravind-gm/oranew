import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jewellery Care Guide',
  description: 'Learn how to care for your ORA fashion jewellery. Tips on cleaning, storage, and maintaining the finish of your pieces.',
  alternates: { canonical: 'https://orashop.in/care' },
  openGraph: {
    title: 'Jewellery Care Guide | ORA Jewellery',
    description: 'Expert tips to keep your ORA jewellery looking its best.',
    url: 'https://orashop.in/care',
    siteName: 'ORA Jewellery',
    type: 'website',
  },
};

export default function CareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
