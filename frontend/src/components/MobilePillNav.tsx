'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';

interface MobilePillNavItem {
  label: string;
  href: string;
  icon?: string;
}

interface MobilePillNavProps {
  items: MobilePillNavItem[];
}

export default function MobilePillNav({ items }: MobilePillNavProps) {
  const pathname = usePathname();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Scroll active item into view on mount and when pathname changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeButton = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeButton) {
        activeButton.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [pathname]);

  // Detect scroll direction to hide/show nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) {
        // Scrolling down
        setScrollDirection('down');
      } else {
        // Scrolling up
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className={`md:hidden sticky top-16 sm:top-20 z-40 bg-white/95 backdrop-blur-sm border-b border-primary/10 px-4 py-2 shadow-sm transition-all duration-300 ${
      scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
    }`}>
      {/* Horizontal scroll container - smooth scrolling with no visible scrollbar */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto whitespace-nowrap gap-3 pb-1 scroll-smooth snap-x snap-mandatory no-scrollbar"
      >

        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-pill-item="true"
              data-active={active ? 'true' : 'false'}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex-shrink-0 snap-start min-h-[44px] ${
                active
                  ? 'bg-primary text-white shadow-md scale-100'
                  : 'bg-primary/10 text-text-primary hover:bg-primary/20 hover:shadow-sm'
              }`}
            >
              {item.icon && <span className="text-base leading-none">{item.icon}</span>}
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
