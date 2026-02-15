'use client';

/**
 * CombosPage — "Combos for Her" Premium BOGO Campaign Landing Page
 * 
 * NEW ARCHITECTURE: Dynamic "Pick Any 2" BOGO Selection System
 * 
 * Architecture:
 *   <CombosPage>
 *     <CombosHero />              — Dark charcoal hero with BOGO messaging
 *     <TrustStrip />              — 4 trust icons on white
 *     <HowItWorks />              — 3-step premium explainer
 *     <PriceTierSelector />       — ₹999 / ₹1499 / ₹1999 / ₹2599 cards
 *     <ComboProductGrid>          — Dynamic product grid
 *       <ComboSelectableCard />   — Selectable BOGO product cards
 *     </ComboProductGrid>
 *     <WhyBuyFromUs />            — 4 emotional value cards (rose bg)
 *     <ComboSummaryBar />         — Sticky selection summary (2 products max)
 *     <ComboRulesModal />         — BOGO rules explanation modal
 *
 * Color system: ORA luxury palette (no random gradients).
 *   Primary Background: #0F0F14 (deep charcoal — hero only)
 *   Card Background:    #FFFFFF
 *   Accent Pink:        #E91E63
 *   Luxury Gold:        #C6A85B
 *   Soft Rose:          #F6E9EE
 */

import { useState } from 'react';
import { useBogoStore } from '@/store/bogoStore';
import CombosHero from './CombosHero';
import TrustStrip from './TrustStrip';
import HowItWorks from './HowItWorks';
import PriceTierSelector from './PriceTierSelector';
import ComboProductGrid from './ComboProductGrid';
import ComboSummaryBar from './ComboSummaryBar';
import WhyBuyFromUs from './WhyBuyFromUs';
import ComboRulesModal from './ComboRulesModal';
import { Info } from 'lucide-react';

export default function CombosPage() {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const { selectedProducts } = useBogoStore();

  return (
    <div className="min-h-screen bg-white">
      {/* 1️⃣ HERO SECTION — Dark charcoal campaign hero */}
      <CombosHero />

      {/* 2️⃣ TRUST STRIP — 4 icons, white bg */}
      <TrustStrip />

      {/* 3️⃣ HOW IT WORKS — 3-step premium explainer */}
      <HowItWorks />

      {/* 4️⃣ CAMPAIGN RULES BANNER */}
      <section className="py-6 bg-gradient-to-r from-ora-rose to-white border-y border-ora-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ora-accent flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ora-text">
                  Build Your Own BOGO Combo
                </h3>
                <p className="text-sm text-ora-muted">
                  Select any 2 products from the same tier. Pay for one, get one free!
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="px-6 py-3 bg-white border border-ora-accent text-ora-accent font-semibold rounded-lg hover:bg-ora-accent hover:text-white transition-colors whitespace-nowrap"
            >
              View Rules
            </button>
          </div>
        </div>
      </section>

      {/* 5️⃣ PRICE TIER SELECTOR — ₹999 / ₹1499 / ₹1999 / ₹2599 */}
      <PriceTierSelector />

      {/* 6️⃣ PRODUCT GRID — Dynamic selectable products */}
      <ComboProductGrid />

      {/* 8️⃣ WHY BUY FROM US — Rose background */}
      <WhyBuyFromUs />

      {/* 9️⃣ STICKY SELECTION SUMMARY (shows when products are selected) */}
      {selectedProducts.length > 0 && <ComboSummaryBar />}

      {/* 🔟 RULES MODAL */}
      <ComboRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
