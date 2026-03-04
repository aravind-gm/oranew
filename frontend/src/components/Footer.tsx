'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <Link href="/" className="inline-block mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-white">ORA</span>
            </Link>
            <p className="text-xs text-white/50 italic mb-3 sm:mb-4 tracking-wide">own. radiate. adorn.</p>
            <p className="text-xs sm:text-sm text-white/40 leading-relaxed mb-4 sm:mb-6">
              Designed to move with you. Everyday confidence, elevated.
            </p>
            {/* Social Links */}
            <div className="flex gap-2 sm:gap-3">
              <a href="https://www.instagram.com/ora_jewellery_official" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all" aria-label="Instagram">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-serif text-sm sm:text-base mb-4 sm:mb-6 text-white">Shop</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link href="/collections" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">All Collections</Link></li>
              <li><Link href="/collections?category=necklace" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Necklaces</Link></li>
              <li><Link href="/collections?category=earrings" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Earrings</Link></li>
              <li><Link href="/collections?category=bracelets" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Bracelets</Link></li>
              <li><Link href="/collections?category=rings" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Rings</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-serif text-sm sm:text-base mb-4 sm:mb-6 text-white">Help</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link href="/about-ora" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">About ORA</Link></li>
              <li><Link href="/contact" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Contact Us</Link></li>
              <li><Link href="/faq" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">FAQs</Link></li>
              <li><Link href="/shipping" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Shipping & Delivery</Link></li>
              <li><Link href="/returns" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Returns & Exchange</Link></li>
              <li><Link href="/care" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Jewellery Care</Link></li>
              <li><Link href="/track-order" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Track Your Order</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-serif text-sm sm:text-base mb-4 sm:mb-6 text-white">My Account</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li><Link href="/auth/login" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Sign In</Link></li>
              <li><Link href="/account" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">My Profile</Link></li>
              <li><Link href="/account/orders" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Order History</Link></li>
              <li><Link href="/wishlist" className="text-sm text-white/50 hover:text-white transition-colors inline-block py-1">Wishlist</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-xs text-white/30 order-3 sm:order-1">
              © 2026 ORA Jewellery. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 order-1 sm:order-2">
              <Link href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors py-1">Privacy Policy</Link>
              <Link href="/terms" className="text-xs text-white/30 hover:text-white/60 transition-colors py-1">Terms of Service</Link>
            </div>
            <div className="flex items-center gap-2 order-2 sm:order-3">
              <span className="text-xs text-white/30 mr-1">We accept:</span>
              <div className="flex gap-1.5">
                <div className="w-9 h-5 bg-white/10 rounded flex items-center justify-center text-[9px] font-semibold text-white/50">VISA</div>
                <div className="w-9 h-5 bg-white/10 rounded flex items-center justify-center text-[9px] font-semibold text-white/50">MC</div>
                <div className="w-9 h-5 bg-white/10 rounded flex items-center justify-center text-[9px] font-semibold text-white/50">UPI</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
