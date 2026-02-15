'use client';

/**
 * GiftsHero - Low-height rectangular hero for Gifts For Her page
 * Clean, compact, emotion-driven design
 */

export default function GiftsHero() {
  return (
    <section className="relative overflow-hidden bg-[#F6E9EE] h-[180px] md:h-[220px]">
      <div className="container mx-auto px-4 h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full items-center">
          
          {/* Left: Text Content */}
          <div className="space-y-3 md:space-y-4 z-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif text-[#111111] leading-tight">
                Gifts That Speak From The Heart.
              </h1>
              <div className="w-24 h-[1px] bg-[#C6A85B] mt-3"></div>
            </div>
            
            <p className="text-sm md:text-base text-[#7A7A85] leading-relaxed max-w-md">
              Thoughtfully curated jewellery for meaningful moments.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <a 
                href="#shop-gifts" 
                className="px-6 py-2.5 bg-[#E91E63] text-white text-sm font-medium rounded-full hover:bg-[#C2185B] transition-colors duration-300"
              >
                Explore Gifts
              </a>
              <a 
                href="#price-under-1499" 
                className="px-6 py-2.5 bg-white text-[#111111] text-sm font-medium rounded-full border border-[#ECECF2] hover:border-[#E91E63] transition-colors duration-300"
              >
                Shop Under ₹1499
              </a>
            </div>
          </div>

          {/* Right: Decorative Image */}
          <div className="hidden md:block relative h-full">
            <div className="absolute inset-0 flex items-center justify-end opacity-15">
              {/* Optional decorative image - using div with emoji as fallback */}
              <div className="text-9xl text-[#E91E63]">💝</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
