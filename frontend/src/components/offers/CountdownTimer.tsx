'use client';

/**
 * CountdownTimer — Reusable countdown timer for offers/flash sales
 * Displays DD:HH:MM:SS with urgency-driven styling
 * ORA Design System
 */

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  /** ISO date string or Date object for the target time */
  targetDate: string | Date;
  /** Compact mode: single line, smaller text */
  compact?: boolean;
  /** Called when timer reaches zero */
  onExpired?: () => void;
  /** Custom label text */
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const total = Math.max(0, target - now);

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

export default function CountdownTimer({
  targetDate,
  compact = false,
  onExpired,
  label = 'Sale ends in',
}: CountdownTimerProps) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(target));
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const tl = calculateTimeLeft(target);
      setTimeLeft(tl);

      if (tl.total <= 0) {
        setExpired(true);
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [target, onExpired]);

  if (expired) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
      >
        ⏰ Offer expired
      </div>
    );
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
        <span style={{ color: '#E91E63' }}>🔥</span>
        <span style={{ color: '#7A7A85' }}>{label}</span>
        <span
          className="font-mono tabular-nums"
          style={{ color: '#E91E63' }}
        >
          {timeLeft.days > 0 && `${pad(timeLeft.days)}:`}
          {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
        🔥 {label}
      </span>
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <>
            <TimeBlock value={timeLeft.days} label="D" />
            <span className="text-lg font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>:</span>
          </>
        )}
        <TimeBlock value={timeLeft.hours} label="H" />
        <span className="text-lg font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>:</span>
        <TimeBlock value={timeLeft.minutes} label="M" />
        <span className="text-lg font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>:</span>
        <TimeBlock value={timeLeft.seconds} label="S" />
      </div>
    </div>
  );
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center w-10 h-10 rounded-md"
      style={{ backgroundColor: 'rgba(233, 30, 99, 0.15)' }}
    >
      <span
        className="text-sm font-bold font-mono tabular-nums leading-none"
        style={{ color: '#FFFFFF' }}
      >
        {pad(value)}
      </span>
      <span
        className="text-[8px] uppercase tracking-wider leading-none mt-0.5"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        {label}
      </span>
    </div>
  );
}
