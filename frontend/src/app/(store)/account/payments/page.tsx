'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking';
  lastFour?: string;
  cardBrand?: string;
  upiId?: string;
  bankName?: string;
  isDefault: boolean;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddUpi, setShowAddUpi] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Simulate fetching payment methods
      setTimeout(() => {
        setPaymentMethods([]);
        setLoading(false);
      }, 500);
    }
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'rupay':
        return '💳';
      default:
        return '💳';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-800">Payment Methods</h1>
            <p className="text-gray-600 mt-1">Manage your saved payment options</p>
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

        {/* Cards Section */}
        <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-xl p-6 md:p-8 border border-rose-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💳</span> Saved Cards
            </h2>
            <button 
              onClick={() => setShowAddCard(!showAddCard)}
              className="text-rose-600 font-medium text-sm hover:text-rose-700 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Card
            </button>
          </div>

          {paymentMethods.filter(m => m.type === 'card').length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">No saved cards</p>
              <p className="text-gray-500 text-sm">Add a card for faster checkout</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.filter(m => m.type === 'card').map((card) => (
                <div key={card.id} className="flex items-center justify-between p-4 border-2 border-rose-100 rounded-2xl hover:border-rose-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{getCardIcon(card.cardBrand)}</span>
                    <div>
                      <p className="font-medium text-gray-800">{card.cardBrand} •••• {card.lastFour}</p>
                      {card.isDefault && (
                        <span className="text-xs text-rose-600 font-medium">Default</span>
                      )}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Card Form */}
          {showAddCard && (
            <div className="mt-6 p-6 bg-rose-50 rounded-2xl border-2 border-rose-200">
              <h3 className="font-semibold text-gray-800 mb-4">Add New Card</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                               focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                               outline-none transition-all text-gray-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                                 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                                 outline-none transition-all text-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                                 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                                 outline-none transition-all text-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 bg-white 
                               focus:border-rose-400 focus:ring-4 focus:ring-rose-100 
                               outline-none transition-all text-gray-800"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-semibold text-white
                               bg-gradient-to-r from-rose-500 to-pink-500
                               hover:from-rose-600 hover:to-pink-600
                               shadow-lg hover:shadow-xl transition-all"
                  >
                    Save Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCard(false)}
                    className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              <p className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Your card details are encrypted and secure
              </p>
            </div>
          )}
        </div>

        {/* UPI Section */}
        <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-xl p-6 md:p-8 border border-rose-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-xl font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📲</span> UPI
            </h2>
            <button 
              onClick={() => setShowAddUpi(!showAddUpi)}
              className="text-rose-600 font-medium text-sm hover:text-rose-700 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add UPI ID
            </button>
          </div>

          {paymentMethods.filter(m => m.type === 'upi').length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📲</span>
              </div>
              <p className="text-gray-600 mb-2">No saved UPI IDs</p>
              <p className="text-gray-500 text-sm">Link your UPI for instant payments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.filter(m => m.type === 'upi').map((upi) => (
                <div key={upi.id} className="flex items-center justify-between p-4 border-2 border-purple-100 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">📲</span>
                    <div>
                      <p className="font-medium text-gray-800">{upi.upiId}</p>
                      {upi.isDefault && (
                        <span className="text-xs text-purple-600 font-medium">Default</span>
                      )}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add UPI Form */}
          {showAddUpi && (
            <div className="mt-6 p-6 bg-purple-50 rounded-2xl border-2 border-purple-200">
              <h3 className="font-semibold text-gray-800 mb-4">Add UPI ID</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                  <input
                    type="text"
                    placeholder="yourname@upi"
                    className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-white 
                               focus:border-purple-400 focus:ring-4 focus:ring-purple-100 
                               outline-none transition-all text-gray-800"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-semibold text-white
                               bg-gradient-to-r from-purple-500 to-indigo-500
                               hover:from-purple-600 hover:to-indigo-600
                               shadow-lg hover:shadow-xl transition-all"
                  >
                    Verify & Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddUpi(false)}
                    className="px-6 py-3 rounded-xl font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Security Note */}
        <div className="backdrop-blur-xl bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-1">Your payments are secure</h3>
              <p className="text-emerald-700 text-sm">
                All payment information is encrypted with 256-bit SSL. We never store your full card number or CVV.
                Payments are processed securely through our PCI-DSS compliant payment partners.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
