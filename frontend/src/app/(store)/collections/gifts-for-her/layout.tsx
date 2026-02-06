import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gifts for Her | ORA - Thoughtful Jewellery for Every Moment',
  description: "Find the perfect gift at ORA. Thoughtful jewellery for birthdays, anniversaries & special occasions. Beautiful pieces she'll love, under ₹1,500.",
  keywords: ['gifts for her', 'jewellery gifts', 'birthday gift', 'anniversary gift', 'gift ideas for women', 'ORA gifts'],
  openGraph: {
    title: 'Gifts for Her | ORA',
    description: 'Thoughtful jewellery for every moment. Perfect gifts under \u20b91,500.',
    type: 'website',
  },
  alternates: {
    canonical: '/collections/gifts-for-her',
  },
};

export default function GiftsForHerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
