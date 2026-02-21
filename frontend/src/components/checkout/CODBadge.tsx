/**
 * COD Available Badge
 * ====================
 *
 * Conditional badge for Cash on Delivery availability.
 * Only renders when COD is enabled — zero DOM output when disabled.
 *
 * Design: small, subtle green accent, inline with payment section.
 * Does not affect layout height when hidden (no placeholder).
 */

import { IndianRupee } from 'lucide-react';

interface CODBadgeProps {
  /** Whether COD is available. When false, renders nothing. */
  enabled?: boolean;
}

export function CODBadge({ enabled = true }: CODBadgeProps) {
  if (!enabled) return null;

  return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <IndianRupee className="w-3 h-3" />
      Cash on Delivery Available
    </div>
  );
}
