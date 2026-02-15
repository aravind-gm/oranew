'use client';

/**
 * StickyMobileCTA - Fixed bottom CTA for mobile devices
 * Improves mobile conversion with easy access to shop
 */

import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StickyMobileCTAProps {
  onShopClick?: () => void;
}

export default function StickyMobileCTA({ onShopClick }: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after user scrolls past hero (500px)
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    // Smooth scroll to product grid
    const productGrid = document.getElementById('shop-gifts');
    if (productGrid) {
      productGrid.scrollIntoView({ behavior: 'smooth' });
    }
    onShopClick?.();
  };

  return (
    <>
      {/* Mobile Only - Sticky Bottom Bar */}
      <div
        className={`
          md:hidden fixed bottom-0 left-0 right-0 z-50
          bg-white border-t border-[#ECECF2] shadow-2xl
          transition-transform duration-300
          ${isVisible ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div className="px-4 py-3">
          <button
            onClick={handleClick}
            className="w-full py-3 bg-[#E91E63] text-white font-semibold rounded-full hover:bg-[#C2185B] transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg"
          >
            <ShoppingBag className="w-5 h-5" />
            Shop Gifts Now
          </button>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind sticky bar */}
      <div className={`md:hidden ${isVisible ? 'h-[72px]' : 'h-0'}`}></div>
    </>
  );
}
