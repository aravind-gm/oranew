'use client';

/**
 * OccasionSelector - Horizontal scrollable occasion chips
 * Filters products by occasion tag
 */

import { useState } from 'react';

const occasions = [
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'anniversary', label: 'Anniversary', emoji: '💝' },
  { id: 'just-because', label: 'Just Because', emoji: '✨' },
  { id: 'wedding', label: 'Wedding', emoji: '💍' },
  { id: 'graduation', label: 'Graduation', emoji: '🎓' },
];

interface OccasionSelectorProps {
  onOccasionChange?: (occasion: string | null) => void;
}

export default function OccasionSelector({ onOccasionChange }: OccasionSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (occasionId: string) => {
    const newSelection = selected === occasionId ? null : occasionId;
    setSelected(newSelection);
    onOccasionChange?.(newSelection);
  };

  return (
    <section className="bg-white border-b border-[#ECECF2] sticky top-0 z-20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-medium text-[#7A7A85] whitespace-nowrap mr-2">
            Shop by Occasion:
          </span>
          
          <div className="flex gap-2">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() => handleSelect(occasion.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-all duration-300 ease-out
                  ${selected === occasion.id
                    ? 'bg-[#E91E63] text-white shadow-md scale-105'
                    : 'bg-white text-[#111111] border border-[#ECECF2] hover:border-[#E91E63] hover:text-[#E91E63]'
                  }
                `}
              >
                <span className="mr-1">{occasion.emoji}</span>
                {occasion.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
