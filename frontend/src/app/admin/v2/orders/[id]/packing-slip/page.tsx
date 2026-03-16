'use client';

/**
 * ORA Admin — Packing Slip / Invoice Print Page
 * ================================================
 * Print-friendly packing slip with:
 * - Order number & date
 * - Customer & shipping details
 * - Itemized product list with prices
 * - Payment summary (subtotal, discount, GST, total)
 * - Tracking ID if available
 * - Business info (GSTIN, address)
 * 
 * Usage: Navigate to /admin/v2/orders/[id]/packing-slip
 *        Click "Print" or Ctrl+P to print
 */

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  shippedAt?: string;
  trackingNumber?: string;
  courierName?: string;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  gstAmount: number;
  shippingFee: number;
  totalAmount: number;
  user?: {
    fullName: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    gstRate?: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  billingAddress?: {
    fullName: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
}

export default function PackingSlipPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/admin/orders/${orderId}`);
        const data = res.data?.data || res.data?.order || res.data;
        setOrder(data);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        setError(err.response?.data?.error || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <p className="text-red-600 text-lg">{error || 'Order not found'}</p>
        <button onClick={() => router.back()} className="text-blue-600 underline">
          Go Back
        </button>
      </div>
    );
  }

  const isCOD = order.paymentMethod === 'COD';

  return (
    <>
      {/* Print Styles — embedded so it works standalone */}
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          @page { margin: 12mm 10mm; size: A4; }
        }
      `}</style>

      {/* Toolbar — hidden during print */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
          >
            ← Back to Order
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Packing Slip — #{order.orderNumber}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      {/* Packing Slip Content */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 min-h-screen" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
        
        {/* Header — Brand + Invoice Info */}
        <div className="flex justify-between items-start border-b-2 border-gray-900 pb-5 mb-6">
          <div>
            <h1 className="text-3xl font-light tracking-[6px] text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
              ORA
            </h1>
            <p className="text-[10px] text-gray-500 tracking-[2px] mt-1">own · radiate · adorn</p>
            <div className="mt-3 text-xs text-gray-600 space-y-0.5">
              <p>Ora Global</p>
              <p>GSTIN: 33AAJFO8903F1ZA</p>
              <p>admin@orashop.in | orashop.in</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isCOD ? 'PACKING SLIP / COD' : 'TAX INVOICE'}
            </h2>
            <table className="text-xs text-gray-600 ml-auto">
              <tbody>
                <tr>
                  <td className="pr-3 py-0.5 text-gray-500 text-right">Order No:</td>
                  <td className="font-semibold text-gray-900">{order.orderNumber}</td>
                </tr>
                <tr>
                  <td className="pr-3 py-0.5 text-gray-500 text-right">Order Date:</td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
                <tr>
                  <td className="pr-3 py-0.5 text-gray-500 text-right">Payment:</td>
                  <td>{isCOD ? 'Cash on Delivery' : 'Online (Razorpay)'}</td>
                </tr>
                {order.trackingNumber && (
                  <tr>
                    <td className="pr-3 py-0.5 text-gray-500 text-right">Tracking #:</td>
                    <td className="font-mono font-semibold text-gray-900">{order.trackingNumber}</td>
                  </tr>
                )}
                {order.courierName && (
                  <tr>
                    <td className="pr-3 py-0.5 text-gray-500 text-right">Courier:</td>
                    <td>{order.courierName}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer / Shipping Addresses */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Ship To</h3>
            <div className="text-sm text-gray-800 space-y-0.5">
              <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
              {order.shippingAddress.phone && (
                <p className="mt-1">📞 {order.shippingAddress.phone}</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
            <div className="text-sm text-gray-800 space-y-0.5">
              {order.billingAddress ? (
                <>
                  <p className="font-semibold text-gray-900">{order.billingAddress.fullName}</p>
                  <p>{order.billingAddress.addressLine1}</p>
                  {order.billingAddress.addressLine2 && <p>{order.billingAddress.addressLine2}</p>}
                  <p>{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.pincode}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-gray-900">{order.user?.fullName || order.shippingAddress.fullName}</p>
                  <p>{order.user?.email}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="text-left py-2.5 px-3 font-medium text-xs">#</th>
              <th className="text-left py-2.5 px-3 font-medium text-xs">Product</th>
              <th className="text-center py-2.5 px-3 font-medium text-xs">Qty</th>
              <th className="text-right py-2.5 px-3 font-medium text-xs">Unit Price</th>
              <th className="text-right py-2.5 px-3 font-medium text-xs">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                <td className="py-2.5 px-3 text-gray-900 font-medium">{item.productName}</td>
                <td className="py-2.5 px-3 text-center text-gray-700">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right text-gray-700">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2.5 px-3 text-right text-gray-900 font-semibold">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Discount {order.couponCode ? `(${order.couponCode})` : ''}
                  </span>
                  <span className="text-green-700">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">GST (incl.)</span>
                <span className="text-gray-700">{formatCurrency(order.gstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-700">{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-900">
                <span className="font-bold text-gray-900 text-base">Total</span>
                <span className="font-bold text-gray-900 text-base">{formatCurrency(order.totalAmount)}</span>
              </div>
              {isCOD && (
                <div className="flex justify-between pt-1">
                  <span className="text-red-700 font-semibold text-xs">💵 COLLECT ON DELIVERY</span>
                  <span className="text-red-700 font-bold">{formatCurrency(order.totalAmount)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="border-t border-gray-300 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-8 text-xs text-gray-500">
            <div>
              <p className="font-semibold text-gray-700 mb-1">Return & Exchange Policy</p>
              <p>7-day return/exchange from delivery. Items must be unused with original packaging & tags attached. Contact admin@orashop.in for returns.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">Care Instructions</p>
              <p>Store in provided gift box. Avoid contact with perfumes, water, and chemicals. Wipe gently with a soft cloth after use.</p>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 pt-3 border-t border-gray-200">
            <p>Thank you for shopping with ORA! 💕</p>
            <p className="mt-1">Sold by Ora Global | GSTIN: 33AAJFO8903F1ZA | orashop.in</p>
          </div>
        </div>
      </div>
    </>
  );
}
