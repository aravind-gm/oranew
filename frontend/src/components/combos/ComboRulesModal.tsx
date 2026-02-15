'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ComboRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ComboRulesModal({ isOpen, onClose }: ComboRulesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-ora-border px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-ora-text">
                  How BOGO Works
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-ora-rose rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-ora-muted" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Hero Statement */}
                <div className="bg-gradient-to-br from-ora-rose to-white rounded-xl p-6 border border-ora-accent/20">
                  <h3 className="text-xl font-semibold text-ora-text mb-2">
                    Buy 1, Get 1 Free! 🎁
                  </h3>
                  <p className="text-ora-muted">
                    Select any 2 products from the same price tier and pay for
                    only one. The cheaper item is automatically free.
                  </p>
                </div>

                {/* Rules */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-ora-text">
                    Campaign Rules
                  </h4>

                  <div className="space-y-3">
                    <RuleItem
                      number="1"
                      title="Choose Your Tier"
                      description="Select products from the same price tier: ₹999, ₹1,499, ₹1,999, or ₹2,599."
                    />
                    <RuleItem
                      number="2"
                      title="Select Any 2 Products"
                      description="Pick any 2 eligible products from your chosen tier. Mix and match freely — earrings, necklaces, rings, or bracelets."
                    />
                    <RuleItem
                      number="3"
                      title="Automatic Discount"
                      description="The cheaper product is automatically discounted to ₹0. If both have the same price, the first item you selected becomes free."
                    />
                    <RuleItem
                      number="4"
                      title="Add to Cart"
                      description="Once you've selected 2 products, click 'Add Combo to Bag' to complete your BOGO deal."
                    />
                  </div>
                </div>

                {/* Example */}
                <div className="bg-ora-bg rounded-xl p-6 space-y-3">
                  <h4 className="text-lg font-semibold text-ora-text">
                    Example
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-ora-muted">Product 1:</span>
                      <span className="font-medium text-ora-text">
                        Golden Glow Necklace — ₹1,999
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ora-muted">Product 2:</span>
                      <span className="font-medium text-ora-text">
                        Statement Drop Earrings — ₹1,999
                      </span>
                    </div>
                    <div className="border-t border-ora-border my-2 pt-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-ora-muted">You Pay:</span>
                      <span className="text-xl font-bold text-ora-accent">
                        ₹1,999
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ora-gold font-medium">
                        You Save:
                      </span>
                      <span className="text-ora-gold font-semibold">
                        ₹1,999 (50% OFF)
                      </span>
                    </div>
                  </div>
                </div>

                {/* FAQ */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-ora-text">
                    Frequently Asked Questions
                  </h4>
                  <div className="space-y-3 text-sm">
                    <FAQItem
                      question="Can I mix different price tiers?"
                      answer="No. Both products must be from the same price tier (e.g., both at ₹1,499) to qualify for the BOGO deal."
                    />
                    <FAQItem
                      question="What if I select 2 products at different prices?"
                      answer="The system will only show you products from your selected tier, so you can't accidentally choose mismatched products."
                    />
                    <FAQItem
                      question="Can I apply other discount codes?"
                      answer="BOGO deals cannot be combined with other promotional codes or coupons."
                    />
                    <FAQItem
                      question="Is there a limit on how many BOGO combos I can buy?"
                      answer="No limit! You can add as many BOGO combos as you like to your cart."
                    />
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={onClose}
                  className="w-full bg-ora-accent hover:bg-ora-accent/90 text-white font-semibold py-4 rounded-xl transition-colors"
                >
                  Got It — Start Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const RuleItem = ({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ora-accent text-white flex items-center justify-center font-semibold text-sm">
      {number}
    </div>
    <div className="flex-1">
      <h5 className="font-semibold text-ora-text mb-1">{title}</h5>
      <p className="text-sm text-ora-muted leading-relaxed">{description}</p>
    </div>
  </div>
);

const FAQItem = ({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) => (
  <div className="bg-white rounded-lg p-4 border border-ora-border">
    <h5 className="font-semibold text-ora-text mb-2">{question}</h5>
    <p className="text-ora-muted leading-relaxed">{answer}</p>
  </div>
);
