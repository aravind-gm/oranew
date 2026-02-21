'use client';

/**
 * Checkout Skeleton Loaders
 * ==========================
 *
 * Structured skeleton UI that matches the final checkout layout.
 * Uses pure CSS shimmer animation — no external dependencies.
 *
 * Psychology: Structured placeholders feel 30-40% faster than spinners
 * because users perceive progress when they see the layout forming.
 *
 * Features:
 *  - Zero layout shift (skeletons match real dimensions)
 *  - Hydration safe (renders identically on server + client)
 *  - Minimum 300ms display to prevent flash
 *  - Subtle shimmer, premium feel
 */

import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────
// BASE SHIMMER BLOCK
// ─────────────────────────────────────────────────────

interface SkeletonBlockProps {
  className?: string;
  /** Render as circle (for avatars, icons) */
  circle?: boolean;
}

export function SkeletonBlock({ className = '', circle = false }: SkeletonBlockProps) {
  return (
    <div
      className={`skeleton-shimmer ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      aria-hidden="true"
    />
  );
}

// ─────────────────────────────────────────────────────
// ORDER SUMMARY SKELETON
// ─────────────────────────────────────────────────────

export function OrderSummarySkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Title */}
      <SkeletonBlock className="h-5 w-32 mb-6" />

      {/* Items */}
      <div className="space-y-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBlock className="w-16 h-16 flex-shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3.5 w-3/4" />
              <SkeletonBlock className="h-3 w-16" />
            </div>
            <SkeletonBlock className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Pricing lines */}
      <div className="space-y-3 py-4 border-t border-gray-100">
        <div className="flex justify-between">
          <SkeletonBlock className="h-3.5 w-16" />
          <SkeletonBlock className="h-3.5 w-20" />
        </div>
        <div className="flex justify-between">
          <SkeletonBlock className="h-3.5 w-20" />
          <SkeletonBlock className="h-3.5 w-12" />
        </div>
        <div className="flex justify-between">
          <SkeletonBlock className="h-3.5 w-10" />
          <SkeletonBlock className="h-3.5 w-16" />
        </div>
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <SkeletonBlock className="h-5 w-12" />
          <SkeletonBlock className="h-7 w-28" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// ADDRESS FORM SKELETON
// ─────────────────────────────────────────────────────

export function AddressFormSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      {/* Section title */}
      <SkeletonBlock className="h-6 w-56 mb-6" />

      <div className="space-y-6">
        {/* Contact heading */}
        <SkeletonBlock className="h-3 w-40" />

        {/* Full Name */}
        <div className="space-y-1.5">
          <SkeletonBlock className="h-3.5 w-20" />
          <SkeletonBlock className="h-[52px] w-full" />
        </div>

        {/* Email + Phone row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-24" />
            <SkeletonBlock className="h-[52px] w-full" />
          </div>
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-28" />
            <SkeletonBlock className="h-[52px] w-full" />
          </div>
        </div>

        {/* Divider */}
        <div className="pt-6 border-t border-gray-100" />

        {/* Address heading */}
        <SkeletonBlock className="h-3 w-36" />

        {/* Street */}
        <div className="space-y-1.5">
          <SkeletonBlock className="h-3.5 w-24" />
          <SkeletonBlock className="h-[52px] w-full" />
        </div>

        {/* State + District row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-12" />
            <SkeletonBlock className="h-[52px] w-full" />
          </div>
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-16" />
            <SkeletonBlock className="h-[52px] w-full" />
          </div>
        </div>

        {/* City + Pincode row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-16" />
            <SkeletonBlock className="h-[52px] w-full" />
          </div>
          <div className="space-y-1.5">
            <SkeletonBlock className="h-3.5 w-16" />
            <SkeletonBlock className="h-[52px] w-full" />
          </div>
        </div>

        {/* CTA button */}
        <SkeletonBlock className="h-14 w-full rounded-full" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// PAYMENT SECTION SKELETON
// ─────────────────────────────────────────────────────

export function PaymentSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
      {/* Title */}
      <SkeletonBlock className="h-6 w-40 mb-6" />

      {/* Payment option card */}
      <div className="p-5 border-2 border-gray-100 rounded-xl mb-8">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="w-5 h-5" circle />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-48" />
            <SkeletonBlock className="h-3 w-64" />
          </div>
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
        <SkeletonBlock className="w-12 h-12" circle />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-3 w-56" />
        </div>
      </div>

      {/* Trust grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
            <SkeletonBlock className="w-8 h-8 mx-auto mb-1" circle />
            <SkeletonBlock className="h-2.5 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <SkeletonBlock className="h-14 w-full rounded-full" />
    </div>
  );
}

// ─────────────────────────────────────────────────────
// FULL CHECKOUT SKELETON (combines all sections)
// ─────────────────────────────────────────────────────

/**
 * Full checkout page skeleton. Renders for minimum 300ms to
 * prevent flash, then transitions out smoothly.
 *
 * @param ready - Set to true when real content is ready
 * @param children - Real content to render after skeleton
 */
export function CheckoutSkeleton({
  ready,
  children,
}: {
  ready: boolean;
  children: React.ReactNode;
}) {
  const [showContent, setShowContent] = useState(false);
  const [mountedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!ready) return;

    // Ensure skeleton is visible for at least 300ms
    const elapsed = Date.now() - mountedAt;
    const remaining = Math.max(0, 300 - elapsed);

    const timer = setTimeout(() => setShowContent(true), remaining);
    return () => clearTimeout(timer);
  }, [ready, mountedAt]);

  if (showContent) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 animate-in fade-in duration-200">
      {/* Header skeleton */}
      <div className="text-center mb-8">
        <SkeletonBlock className="h-8 w-52 mx-auto mb-2" />
        <SkeletonBlock className="h-4 w-36 mx-auto" />
      </div>

      {/* Step indicator skeleton */}
      <div className="flex items-center justify-center gap-0 mb-8 lg:mb-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <SkeletonBlock className="w-10 h-10" circle />
              <SkeletonBlock className="h-3 w-14 mt-2" />
            </div>
            {i < 3 && <SkeletonBlock className="w-16 sm:w-24 h-0.5 mx-2" />}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AddressFormSkeleton />
        </div>
        <div className="hidden lg:block">
          <OrderSummarySkeleton />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// GUEST CHECKOUT SKELETON
// ─────────────────────────────────────────────────────

export function GuestCheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-200">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <SkeletonBlock className="w-10 h-10" circle />
          <SkeletonBlock className="h-7 w-40" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form — Left */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact Info card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <SkeletonBlock className="h-5 w-44 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-12" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-20" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-14" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
              </div>
            </div>

            {/* Address card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <SkeletonBlock className="h-5 w-40 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-28" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-10" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-12" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
                <div className="space-y-1.5">
                  <SkeletonBlock className="h-3.5 w-20" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
              </div>
            </div>

            {/* CTA */}
            <SkeletonBlock className="h-14 w-full rounded-xl" />
          </div>

          {/* Summary — Right */}
          <div className="lg:col-span-2">
            <OrderSummarySkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
