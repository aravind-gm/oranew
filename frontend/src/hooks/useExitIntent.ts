'use client';

/**
 * useExitIntent
 * ─────────────
 * Fires once per session when the user moves the mouse to the top 20px of
 * the viewport on a desktop screen (min-width 1024 px).
 *
 * Session guard: localStorage key `ora_exit_intent_shown`
 * Clears on explicit dismiss or successful email submit.
 */

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ora_exit_intent_shown';

export function useExitIntent() {
  const [isOpen, setIsOpen] = useState(false);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, '1');
  }, []);

  useEffect(() => {
    // Desktop only
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 1024) return;
    // Only once per session
    if (localStorage.getItem(STORAGE_KEY)) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 20) {
        setIsOpen(true);
        localStorage.setItem(STORAGE_KEY, '1');
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  return { isOpen, dismiss };
}
