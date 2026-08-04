'use client';

/**
 * AnnouncementBar — Scrolling marquee strip above the header.
 * Hidden on admin pages.
 */

import { usePathname } from 'next/navigation';

const MESSAGES = [
  '✦ Buy Any Necklace · Get a Ring FREE',
  '✦ Free Shipping On All Orders Across India',
  '✦ 5-Day Easy Returns — No Questions Asked',
  '✦ Gift-Ready Packaging On Every Order',
  '✦ Anti-Tarnish · Skin-Safe · Premium Finish',
  '✦ Limited Launch Offer — Shop Now',
];

export default function AnnouncementBar() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  const track = [...MESSAGES, ...MESSAGES]; // double for seamless loop

  return (
    <div className="w-full overflow-hidden bg-[#0F0F14] py-2.5 select-none">
      <div className="flex animate-marquee whitespace-nowrap">
        {track.map((msg, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-4 px-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C6A85B]"
          >
            {msg}
            <span className="text-[#C6A85B]/30">|</span>
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 28s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
