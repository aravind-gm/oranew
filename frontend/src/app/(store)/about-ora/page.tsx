'use client';

/**
 * About ORA — Brand Storytelling Page
 * 
 * This is not a generic About page.
 * This is brand-building for a premium fashion jewellery house.
 * 
 * Sections:
 * 1. Hero — "Wear Your Aura"
 * 2. Our Beginning
 * 3. What ORA Means
 * 4. Our Philosophy
 * 5. For The Modern Woman
 * 6. Brand Manifesto
 * 7. Founder Story — A New Generation of Jewellery
 * 8. Closing
 */

import { motion } from 'framer-motion';
import Link from 'next/link';

// Shared animation config
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
};

const fadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 1, ease: 'easeOut' },
};

export default function AboutOraPage() {
  return (
    <main className="bg-white min-h-screen overflow-x-hidden">

      {/* ═══════════════════════════════════════════
          SECTION 1: HERO — "Wear Your Aura"
          ═══════════════════════════════════════════ */}
      <section className="relative bg-oraLight/40 py-28 md:py-40 lg:py-52">
        {/* Subtle decorative element */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-oraPink/10 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div {...fadeUp}>
            <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-oraAccent/70 mb-6 font-medium">
              About ORA
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-light text-[#1A1A1A] leading-[1.15] mb-8">
              Wear Your Aura.
            </h1>
            <p className="text-base md:text-lg lg:text-xl font-light text-neutral-500 leading-relaxed max-w-xl mx-auto">
              Jewellery designed for the woman
              <br className="hidden md:block" />
              who already shines.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SECTION 2: OUR BEGINNING
          ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] text-center mb-12 md:mb-16">
              Our Beginning
            </h2>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="space-y-8 text-center"
          >
            <p className="text-base md:text-lg font-light text-neutral-600 leading-relaxed">
              ORA was born from a simple belief —
              <br />
              that jewellery should feel personal.
            </p>

            <div className="space-y-2 text-base md:text-lg font-light text-neutral-500 leading-relaxed">
              <p>Not loud.</p>
              <p>Not overwhelming.</p>
              <p>Not reserved only for special occasions.</p>
            </div>

            <p className="text-base md:text-lg font-light text-neutral-600 leading-relaxed">
              But something you wear every day —
              <br />
              as a quiet reminder of who you are.
            </p>

            <p className="text-base md:text-lg font-light text-neutral-500 leading-relaxed pt-4">
              We saw a gap between traditional heaviness and fast fashion noise.
              <br />
              So we created something softer.
              <br />
              Stronger.
              <br />
              More intentional.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SECTION 3: WHAT ORA MEANS
          ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40 bg-oraLight/30">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] text-center mb-12 md:mb-16">
              What ORA Means
            </h2>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="space-y-8 text-center"
          >
            <p className="text-lg md:text-xl font-serif font-light text-[#1A1A1A] italic">
              ORA represents presence.
            </p>

            <div className="space-y-4 text-base md:text-lg font-light text-neutral-500 leading-relaxed">
              <p>It is the energy you carry.</p>
              <p>The confidence you don&apos;t need to announce.</p>
              <p>The glow that comes from within.</p>
            </div>

            <p className="text-base md:text-lg font-light text-neutral-600 leading-relaxed pt-4">
              Our jewellery is designed to complement that energy —
              <br />
              never compete with it.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SECTION 4: OUR PHILOSOPHY
          ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] text-center mb-12 md:mb-16">
              Our Philosophy
            </h2>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="text-center"
          >
            <p className="text-base md:text-lg font-light text-neutral-600 leading-relaxed mb-12">
              We believe:
            </p>

            <div className="space-y-6 max-w-md mx-auto">
              {[
                'Luxury should feel effortless',
                'Minimal can be powerful',
                'Jewellery should move with you',
                'Confidence is the most beautiful accessory',
              ].map((belief, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.6, delay: index * 0.12 }}
                  className="flex items-start gap-4"
                >
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-oraAccent/50 mt-2.5" />
                  <p className="text-base md:text-lg font-light text-neutral-600 leading-relaxed text-left">
                    {belief}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.p
              {...fadeIn}
              transition={{ ...fadeIn.transition, delay: 0.5 }}
              className="text-base md:text-lg font-light text-neutral-500 leading-relaxed mt-14"
            >
              Every ORA piece is curated to elevate everyday moments.
            </motion.p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SECTION 5: FOR THE MODERN WOMAN
          ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40 bg-oraLight/30">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] text-center mb-12 md:mb-16">
              For The Modern Woman
            </h2>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="space-y-6 text-center"
          >
            <div className="space-y-3 text-base md:text-lg font-light text-neutral-500 leading-relaxed">
              <p>She doesn&apos;t wait for occasions.</p>
              <p>She creates them.</p>
            </div>

            <div className="space-y-3 text-base md:text-lg font-light text-neutral-500 leading-relaxed pt-4">
              <p>She chooses herself.</p>
              <p>She celebrates quietly.</p>
              <p>She invests in how she feels.</p>
            </div>

            <p className="text-lg md:text-xl font-serif font-light text-[#1A1A1A] italic pt-8">
              ORA is for her.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SECTION 6: THE ORA MANIFESTO
          ═══════════════════════════════════════════ */}
      <section className="py-28 md:py-36 lg:py-44 bg-[#1A1A1A] text-white relative overflow-hidden">
        {/* Subtle ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-oraAccent/5 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <p className="text-xs md:text-sm tracking-[0.3em] uppercase text-oraAccent/60 text-center mb-8 font-medium">
              The ORA Manifesto
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="space-y-10 text-center"
          >
            <p className="text-lg md:text-xl font-serif font-light text-white/90 leading-relaxed">
              We believe in quiet power.
            </p>

            <div className="space-y-2 text-base md:text-lg font-light text-white/60 leading-relaxed">
              <p>In the kind of elegance that doesn&apos;t need attention —</p>
              <p>but receives it anyway.</p>
            </div>

            <div className="space-y-2 text-base md:text-lg font-light text-white/60 leading-relaxed">
              <p>We believe in celebrating small wins.</p>
              <p>In dressing up for no reason.</p>
              <p>In choosing confidence daily.</p>
            </div>

            <div className="space-y-2 text-base md:text-lg font-light text-white/60 leading-relaxed">
              <p>We believe jewellery is not decoration.</p>
              <p className="text-white/80 font-serif italic">It is expression.</p>
            </div>

            <div className="space-y-2 text-base md:text-lg font-light text-white/60 leading-relaxed">
              <p>Not louder.</p>
              <p className="text-white/80">Just stronger.</p>
            </div>

            <div className="space-y-2 text-base md:text-lg font-light text-white/60 leading-relaxed">
              <p>Not heavier.</p>
              <p className="text-white/80">Just meaningful.</p>
            </div>

            {/* Decorative separator */}
            <div className="flex items-center justify-center gap-3 py-4">
              <span className="w-8 h-px bg-oraAccent/30" />
              <span className="w-1.5 h-1.5 rounded-full bg-oraAccent/40" />
              <span className="w-8 h-px bg-oraAccent/30" />
            </div>

            <div className="space-y-2 text-base md:text-lg font-light text-white/60 leading-relaxed">
              <p>ORA is for women who move with intention.</p>
              <p>Who shine without permission.</p>
              <p>Who carry presence in silence.</p>
            </div>

            <div className="space-y-2 text-base md:text-lg font-light text-white/60 leading-relaxed pt-4">
              <p>You don&apos;t wear ORA to impress.</p>
              <p className="text-white/90 font-serif">You wear ORA to remember who you are.</p>
            </div>

            <p className="text-xl md:text-2xl font-serif font-light text-oraAccent/80 italic pt-6">
              Wear your aura.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SECTION 7: A NEW GENERATION OF JEWELLERY
          ═══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl md:text-4xl font-serif font-light text-[#1A1A1A] text-center mb-12 md:mb-16">
              A New Generation of Jewellery
            </h2>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="space-y-8 text-center"
          >
            <p className="text-base md:text-lg font-light text-neutral-600 leading-relaxed">
              ORA was created with a modern vision —
              <br />
              to reimagine jewellery for today&apos;s woman.
            </p>

            <p className="text-base md:text-lg font-light text-neutral-500 leading-relaxed">
              Growing up around the world of jewellery,
              <br />
              we saw how pieces were often designed for occasions, traditions, or expectations.
            </p>

            <p className="text-base md:text-lg font-light text-neutral-600 leading-relaxed">
              But we wanted something different.
            </p>

            <div className="space-y-3 text-base md:text-lg font-light text-neutral-500 leading-relaxed">
              <p>Something that felt effortless.</p>
              <p>Something that felt wearable.</p>
              <p>Something that felt like <span className="italic text-neutral-600">you</span>.</p>
            </div>

            <div className="space-y-3 text-base md:text-lg font-light text-neutral-500 leading-relaxed pt-4">
              <p>So ORA became more than a brand.</p>
              <p>It became a reminder —</p>
              <p className="text-neutral-600">that confidence doesn&apos;t need an event.</p>
            </div>

            <p className="text-lg md:text-xl font-serif font-light text-[#1A1A1A] italic pt-6">
              It just needs you.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════
          SECTION 8: CLOSING
          ═══════════════════════════════════════════ */}
      <section className="py-28 md:py-36 lg:py-44 bg-oraLight/40 relative overflow-hidden">
        {/* Subtle decorative element */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-oraPink/15 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <motion.div {...fadeUp}>
            <div className="space-y-6">
              <p className="text-base md:text-lg font-light text-neutral-500 leading-relaxed">
                Because jewellery isn&apos;t just what you wear.
                <br />
                It&apos;s how you feel wearing it.
              </p>

              <p className="text-base md:text-lg font-light text-neutral-500 leading-relaxed">
                And when you feel confident —
                <br />
                <span className="text-[#1A1A1A] font-serif italic text-lg md:text-xl">you wear your aura.</span>
              </p>
            </div>

            {/* CTA */}
            <div className="mt-16">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-10 py-4 bg-[#1A1A1A] text-white text-sm font-medium tracking-wider uppercase rounded-none hover:bg-neutral-800 transition-colors duration-300"
              >
                Explore the Collection
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Micro brand line */}
            <p className="mt-12 text-xs tracking-[0.25em] uppercase text-oraAccent/50 font-medium">
              Subtle. Strong. Unforgettable.
            </p>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
