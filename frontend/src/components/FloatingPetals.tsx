'use client';

/**
 * FloatingPetals — Soft flower petal rain for Women's Day celebration
 * 
 * Lightweight CSS-only animation (no heavy JS).
 * Renders ~15 petals that drift down and sway.
 * Auto-removes after page has been open 20s (doesn't repeat).
 */

import { useEffect, useState } from 'react';

const PETAL_CHARS = ['🌸', '✿', '🌺', '💐', '🪻', '❀', '✾'];
const PETAL_COUNT = 18;

interface Petal {
  id: number;
  char: string;
  left: number;      // % from left
  delay: number;     // animation delay in s
  duration: number;  // fall duration in s
  size: number;      // font-size in px
  sway: number;      // horizontal drift in px
}

function generatePetals(): Petal[] {
  return Array.from({ length: PETAL_COUNT }, (_, i) => ({
    id: i,
    char: PETAL_CHARS[Math.floor(Math.random() * PETAL_CHARS.length)],
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 6 + Math.random() * 6,
    size: 12 + Math.random() * 14,
    sway: 30 + Math.random() * 60,
  }));
}

export default function FloatingPetals() {
  const [show, setShow] = useState(true);
  const [petals] = useState(generatePetals);

  useEffect(() => {
    // Auto-hide after 20 seconds to not annoy users
    const timer = setTimeout(() => setShow(false), 20000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
      <style jsx>{`
        @keyframes petal-fall {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(45vh) translateX(var(--sway)) rotate(180deg);
            opacity: 0.6;
          }
          100% {
            transform: translateY(105vh) translateX(calc(var(--sway) * -0.5)) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 select-none"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationName: 'petal-fall',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: '2',
            animationFillMode: 'both',
            '--sway': `${p.sway}px`,
            opacity: 0,
          } as React.CSSProperties}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}
