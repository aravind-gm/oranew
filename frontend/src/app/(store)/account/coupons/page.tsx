'use client';

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt: string;
  isUsed: boolean;
}

export default function CouponsPage() {
  const router = useRouter();
  const { user, loading: isLoading } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      // Simulate fetching coupons
      setTimeout(() => {
        setCoupons([
          {
            id: '1',
            code: 'WELCOME20',
            title: 'Welcome Discount',
            description: 'Get 20% off on your first order',
            discountType: 'percentage',
            discountValue: 20,
            minOrderValue: 1000,
            maxDiscount: 500,
            expiresAt: '2026-03-31',
            isUsed: false,
          },
          {
            id: '2',
            code: 'FLAT500',
            title: 'Flat ₹500 Off',
            description: 'Flat ₹500 discount on orders above ₹2500',
            discountType: 'fixed',
            discountValue: 500,
            minOrderValue: 2500,
            expiresAt: '2026-02-28',
            isUsed: false,
          },
          {
            id: '3',
            code: 'VALENTINE15',
            title: "Valentine's Special",
            description: '15% off on all jewellery',
            discountType: 'percentage',
            discountValue: 15,
            minOrderValue: 500,
            maxDiscount: 300,
            expiresAt: '2026-02-14',
            isUsed: false,
          },
        ]);
        setLoading(false);
      }, 500);
    }
  }, [user]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDaysLeft = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your coupons...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeCoupons = coupons.filter(c => !c.isUsed && getDaysLeft(c.expiresAt) > 0);
  const expiredCoupons = coupons.filter(c => c.isUsed || getDaysLeft(c.expiresAt) <= 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-800">Coupons & Offers</h1>
            <p className="text-gray-600 mt-1">Your available discounts and promotions</p>
          </div>
          <Link 
            href="/account"
            className="flex items-center gap-2 px-4 py-2 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </Link>
        </div>

        {/* Active Coupons */}
        <div className="mb-8">
          <h2 className="font-serif text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎟️</span> Available Coupons ({activeCoupons.length})
          </h2>

          {activeCoupons.length === 0 ? (
            <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-xl p-8 border border-rose-100 text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🎫</span>
              </div>
              <p className="text-gray-600 mb-2">No active coupons available</p>
              <p className="text-gray-500 text-sm">Check back later for exclusive offers!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCoupons.map((coupon) => {
                const daysLeft = getDaysLeft(coupon.expiresAt);
                return (
                  <div 
                    key={coupon.id} 
                    className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-xl border border-rose-100 overflow-hidden hover:shadow-2xl transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Discount Badge */}
                      <div className="w-full md:w-32 bg-gradient-to-br from-rose-500 to-pink-600 p-6 flex flex-col items-center justify-center text-white">
                        <span className="text-3xl font-bold">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </span>
                        <span className="text-sm font-medium opacity-90">OFF</span>
                      </div>

                      {/* Right: Details */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800 text-lg">{coupon.title}</h3>
                            <p className="text-gray-600 text-sm">{coupon.description}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            daysLeft <= 3 
                              ? 'bg-red-100 text-red-600' 
                              : daysLeft <= 7 
                                ? 'bg-amber-100 text-amber-600' 
                                : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {daysLeft === 1 ? 'Expires tomorrow' : `${daysLeft} days left`}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                            Min order: ₹{coupon.minOrderValue}
                          </span>
                          {coupon.maxDiscount && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                              Max discount: ₹{coupon.maxDiscount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Coupon Code */}
                          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl">
                            <span className="font-mono font-bold text-rose-600 tracking-wider">{coupon.code}</span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                              copiedCode === coupon.code
                                ? 'bg-emerald-500 text-white'
                                : 'bg-rose-500 text-white hover:bg-rose-600'
                            }`}
                          >
                            {copiedCode === coupon.code ? '✓ Copied!' : 'Copy Code'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expired/Used Coupons */}
        {expiredCoupons.length > 0 && (
          <div>
            <h2 className="font-serif text-xl font-semibold text-gray-500 mb-4 flex items-center gap-2">
              <span className="text-2xl opacity-50">📋</span> Expired / Used ({expiredCoupons.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {expiredCoupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className="backdrop-blur-xl bg-white/60 rounded-2xl p-4 border border-gray-200 flex items-center gap-4"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400 font-bold">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-600">{coupon.title}</h3>
                    <p className="text-gray-500 text-sm">{coupon.code}</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium px-2 py-1 bg-gray-100 rounded-lg">
                    {coupon.isUsed ? 'Used' : 'Expired'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Promo Input */}
        <div className="mt-8 backdrop-blur-xl bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-6 border border-amber-200">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-xl">✨</span> Have a promo code?
          </h3>
          <p className="text-gray-600 text-sm mb-4">Enter your coupon code below to add it to your account</p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-amber-200 bg-white 
                         focus:border-amber-400 focus:ring-4 focus:ring-amber-100 
                         outline-none transition-all text-gray-800 uppercase font-mono"
            />
            <button className="px-6 py-3 rounded-xl font-semibold text-white
                             bg-gradient-to-r from-amber-500 to-yellow-500
                             hover:from-amber-600 hover:to-yellow-600
                             shadow-lg hover:shadow-xl transition-all whitespace-nowrap">
              Apply Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
