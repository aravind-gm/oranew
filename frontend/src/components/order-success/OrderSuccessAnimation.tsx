'use client';

/**
 * OrderSuccessAnimation — Cinematic Delivery Truck Sequence
 *
 * Timeline:
 *  0.0s → Jewellery box fade-in at center
 *  0.7s → Box lifts upward
 *  1.2s → Box transforms to delivery package
 *  1.5s → ORA truck enters from left
 *  2.3s → Package slides into truck cargo
 *  3.0s → Truck drives off to the right
 *  3.5s → Success message + order ID reveal
 *
 * Uses Framer Motion. Plays once. Accessible fallback included.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import JewelryBox from './JewelryBox';
import DeliveryPackage from './Package';
import Truck from './Truck';
import SuccessMessage from './SuccessMessage';

type Phase = 'box' | 'lift' | 'package' | 'truck-enter' | 'package-load' | 'truck-leave' | 'reveal';

const TIMINGS = {
  boxAppear: 0,
  boxLift: 700,
  packageTransform: 1200,
  truckEnter: 1500,
  packageLoad: 2300,
  truckLeave: 3000,
  reveal: 3500,
};

interface Props {
  orderDisplayId: string;
}

export default function OrderSuccessAnimation({ orderDisplayId }: Props) {
  const [phase, setPhase] = useState<Phase>('box');
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setReducedMotion(true);
      setPhase('reveal');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setPhase('lift'), TIMINGS.boxLift));
    timers.push(setTimeout(() => setPhase('package'), TIMINGS.packageTransform));
    timers.push(setTimeout(() => setPhase('truck-enter'), TIMINGS.truckEnter));
    timers.push(setTimeout(() => setPhase('package-load'), TIMINGS.packageLoad));
    timers.push(setTimeout(() => setPhase('truck-leave'), TIMINGS.truckLeave));
    timers.push(setTimeout(() => setPhase('reveal'), TIMINGS.reveal));

    return () => timers.forEach(clearTimeout);
  }, []);

  // Fallback for reduced motion
  if (reducedMotion) {
    return (
      <div className="w-full max-w-md mx-auto py-8">
        <SuccessMessage orderDisplayId={orderDisplayId} />
      </div>
    );
  }

  const showBox = phase === 'box' || phase === 'lift';
  const showPackage = phase === 'package' || phase === 'truck-enter' || phase === 'package-load';
  const showTruck = phase === 'truck-enter' || phase === 'package-load' || phase === 'truck-leave';
  const showReveal = phase === 'reveal';

  return (
    <div className="relative w-full max-w-lg mx-auto mb-6 overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFF5F7] via-white to-[#FFF9F0]" style={{ height: 280 }}>
      {/* Road at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="h-2 bg-gradient-to-t from-stone-200 to-stone-100" />
        <div className="h-8 bg-gray-500 relative">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] border-t-2 border-dashed border-yellow-300/50 -translate-y-1/2" />
        </div>
      </div>

      {/* ═══ PHASE: Jewellery Box ═══ */}
      <AnimatePresence>
        {showBox && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: phase === 'lift' ? -30 : 0,
              scale: phase === 'lift' ? 0.9 : 1,
            }}
            exit={{ opacity: 0, scale: 0.6, y: -40 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <JewelryBox />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PHASE: Package ═══ */}
      <AnimatePresence>
        {showPackage && (
          <motion.div
            className="absolute z-25"
            style={{ top: '35%', left: '50%' }}
            initial={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
            animate={{
              opacity: phase === 'package-load' ? 0 : 1,
              scale: phase === 'package-load' ? 0.6 : 1,
              x: phase === 'package-load' ? '20%' : '-50%',
              y: phase === 'package-load' ? '30%' : '-50%',
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <DeliveryPackage />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PHASE: Truck ═══ */}
      <AnimatePresence>
        {showTruck && (
          <motion.div
            className="absolute z-20"
            style={{ bottom: 14 }}
            initial={{ x: -280 }}
            animate={{
              x: phase === 'truck-leave' ? 600 : 80,
            }}
            exit={{ x: 700 }}
            transition={{
              duration: phase === 'truck-leave' ? 1.2 : 0.8,
              ease: phase === 'truck-leave' ? [0.4, 0, 0.2, 1] : [0.22, 1, 0.36, 1],
            }}
          >
            <Truck />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PHASE: Success Reveal ═══ */}
      <AnimatePresence>
        {showReveal && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <SuccessMessage orderDisplayId={orderDisplayId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
