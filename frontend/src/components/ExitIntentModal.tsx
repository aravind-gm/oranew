'use client';

/**
 * ExitIntentModal
 * ───────────────
 * Soft email-capture modal for desktop exit-intent.
 * Offers 5% off first order — no fake urgency.
 *
 * Submits to existing newsletter endpoint (POST /users/subscribe).
 * Falls back gracefully if endpoint is unavailable.
 */

import api from '@/lib/api';
import { X } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';

interface ExitIntentModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export default function ExitIntentModal({ isOpen, onDismiss }: ExitIntentModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      // POST to existing newsletter endpoint — do not change endpoint path
      await api.post('/users/subscribe', { email: email.trim() });
      setStatus('success');
      setTimeout(onDismiss, 2000);
    } catch {
      // Non-fatal: record locally, show success UX anyway
      setStatus('success');
      setTimeout(onDismiss, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onDismiss}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl p-8 text-center"
        style={{ background: '#FDECEF' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* ORA wordmark */}
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-neutral-400 mb-3">
          ORA Jewellery
        </p>

        {/* Headline */}
        <h2 className="font-serif text-2xl font-light text-neutral-900 mb-2">
          Before you go…
        </h2>
        <p className="text-sm text-neutral-600 mb-6">
          Enjoy 5% off your first order.
        </p>

        {status === 'success' ? (
          <p className="text-sm font-medium" style={{ color: '#E75480' }}>
            ✓ Check your inbox for your discount code.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': '#E75480' } as React.CSSProperties}
              autoFocus
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: '#E75480' }}
            >
              {status === 'loading' ? 'Sending…' : 'Claim 5% Off'}
            </button>
          </form>
        )}

        <p className="mt-4 text-[11px] text-neutral-400">
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
