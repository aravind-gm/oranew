'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-foreground text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="container-luxury py-10 sm:py-16">
          <div className="max-w-2xl mx-auto text-center px-2">
            <h3 className="text-xl sm:text-2xl font-serif font-light mb-2 sm:mb-3 text-primary">Join the ORA Family</h3>
            <p className="text-white/60 text-xs sm:text-sm mb-4 sm:mb-6">
              Subscribe for exclusive offers, latest collections, and styling inspiration.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3.5 sm:py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base sm:text-sm min-h-[48px]"
              />
              <button
                type="submit"
                className="px-6 py-3.5 sm:py-3 bg-primary text-foreground rounded-full font-medium hover:bg-primary/80 transition-colors text-sm min-h-[48px]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-luxury py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <Link href="/" className="inline-block mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl font-serif font-bold text-primary">ORA</span>
            </Link>
            <p className="text-sm text-primary/80 italic mb-3 sm:mb-4">own. radiate. adorn.</p>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-4 sm:mb-6">
              Premium artificial fashion jewellery crafted for the modern woman who celebrates her unique style.
            </p>
            {/* Social Links */}
            <div className="flex gap-2 sm:gap-3">
              <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all group">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all group">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all group">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
              </a>
              <a href="#" className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all group">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-serif text-base sm:text-lg mb-4 sm:mb-6 text-white">Shop</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/products" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  All Collections
                </Link>
              </li>
              <li>
                <Link href="/products?category=necklaces" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Necklaces
                </Link>
              </li>
              <li>
                <Link href="/products?category=earrings" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Earrings
                </Link>
              </li>
              <li>
                <Link href="/products?category=bracelets" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Bracelets
                </Link>
              </li>
              <li>
                <Link href="/products?category=rings" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Rings
                </Link>
              </li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-serif text-base sm:text-lg mb-4 sm:mb-6 text-white">Help</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/contact" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Returns & Exchange
                </Link>
              </li>
              <li>
                <Link href="/care" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Jewellery Care
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-serif text-base sm:text-lg mb-4 sm:mb-6 text-white">My Account</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <Link href="/auth/login" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-sm text-white/60 hover:text-primary transition-colors inline-block py-1">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-luxury py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <p className="text-xs text-white/40 order-3 sm:order-1">
              © 2026 ORA Jewellery. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 order-1 sm:order-2">
              <Link href="/privacy" className="text-xs text-white/40 hover:text-primary transition-colors py-1">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-white/40 hover:text-primary transition-colors py-1">
                Terms of Service
              </Link>
              <Link href="/admin/login" className="text-xs text-white/40 hover:text-primary transition-colors py-1">
                Admin
              </Link>
            </div>
            {/* Payment Methods */}
            <div className="flex items-center gap-2 order-2 sm:order-3">
              <span className="text-xs text-white/40 mr-1 sm:mr-2">We accept:</span>
              <div className="flex gap-1.5 sm:gap-2">
                <div className="w-9 h-5 sm:w-10 sm:h-6 bg-white/10 rounded flex items-center justify-center text-[9px] sm:text-[10px] font-semibold">VISA</div>
                <div className="w-9 h-5 sm:w-10 sm:h-6 bg-white/10 rounded flex items-center justify-center text-[9px] sm:text-[10px] font-semibold">MC</div>
                <div className="w-9 h-5 sm:w-10 sm:h-6 bg-white/10 rounded flex items-center justify-center text-[9px] sm:text-[10px] font-semibold">UPI</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
