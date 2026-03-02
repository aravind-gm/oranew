'use client';

/**
 * About ORA — Cinematic Brand Experience
 * 
 * Creative direction: Jacquemus × Cartier editorial × SKIMS storytelling
 * 
 * Sections:
 * 1. HERO — Immersive full-viewport statement
 * 2. FOUNDER STORY — Split editorial layout
 * 3. ORA MANIFESTO — Cinematic dark section with scroll reveals
 * 4. CRAFT & PHILOSOPHY — Visual grid with hover reveals
 * 5. EMOTIONAL BRAND — Ambient gradient identity section
 * 6. CLOSING CTA — Minimal centered call to action
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';

/* ─── Animation presets ─── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const fadeSlideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeSlideLeft = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const revealLine = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ─── Rose gold divider component ─── */
function RoseGoldDivider() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center gap-4 py-2"
    >
      <span className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent to-[#C6A85B]/40" />
      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A85B]/50" />
      <span className="w-16 md:w-24 h-px bg-gradient-to-l from-transparent to-[#C6A85B]/40" />
    </motion.div>
  );
}

export default function AboutOraPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <main className="bg-white min-h-screen overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: HERO — Immersive Full Viewport Statement
          Parallax scroll · Animated gradient · Floating glow
          ═══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-[100svh] min-h-[700px] flex items-center justify-center overflow-hidden"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDF2F5] via-[#F6C1CF]/20 to-white" />

        {/* Floating ambient glow orbs */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[#F6C1CF]/20 blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[#E75480]/10 blur-[80px] pointer-events-none"
        />

        {/* Grain texture overlay */}
        <div className="absolute inset-0 ora-grain pointer-events-none" />

        {/* Hero content with parallax */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#C6A85B]/80 mb-8 md:mb-10 font-medium"
          >
            The Story of ORA
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-light text-[#1A1A1A] leading-[1.05] mb-8 md:mb-10"
          >
            Wear Your Aura.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-base sm:text-lg md:text-xl font-light text-neutral-500 leading-relaxed max-w-lg mx-auto mb-12 md:mb-14"
          >
            Jewellery designed for the woman
            <br />
            who already shines.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <Link
              href="/collections"
              className="group inline-flex items-center gap-3 text-xs md:text-sm tracking-[0.2em] uppercase font-medium text-[#1A1A1A] border-b border-[#1A1A1A]/25 pb-2 hover:border-[#E75480] hover:text-[#E75480] transition-all duration-500"
            >
              Discover the Collection
              <svg className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-transparent via-[#C6A85B]/40 to-transparent"
          />
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: THE FOUNDER STORY
          Split layout: editorial image + narrative
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-[120px] md:py-[160px] lg:py-[200px] bg-white relative">
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: Editorial image */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative"
            >
              <div className="relative aspect-[3/4] bg-gradient-to-br from-[#F6C1CF]/20 via-[#FDF2F5] to-[#F7F7F7] overflow-hidden">
                {/* Placeholder — editorial portrait zone */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 rounded-full bg-[#F6C1CF]/30 flex items-center justify-center">
                      <span className="text-3xl md:text-4xl font-serif font-light text-[#E75480]/60">O</span>
                    </div>
                    <p className="text-xs tracking-[0.3em] uppercase text-[#C6A85B]/60 font-medium">Editorial Portrait</p>
                    <p className="text-[10px] tracking-wider text-neutral-400 mt-2">Soft, natural, intentional</p>
                  </div>
                </div>

                {/* Decorative corner accents */}
                <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-[#C6A85B]/20" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-[#C6A85B]/20" />
              </div>
            </motion.div>

            {/* Right: Founder narrative */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="lg:py-8"
            >
              <motion.p variants={revealLine} className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-[#C6A85B]/70 mb-6 font-medium">
                The Beginning
              </motion.p>

              <motion.h2 variants={fadeSlideUp} className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1A1A1A] leading-[1.15] mb-10 md:mb-12">
                A New Generation
                <br />
                <span className="italic text-[#E75480]/80">of Jewellery</span>
              </motion.h2>

              <div className="space-y-7">
                <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.8]">
                  Growing up around the world of jewellery, we saw how pieces were often designed for occasions, traditions, or expectations.
                </motion.p>

                <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.8]">
                  We wanted something different. Something that felt effortless.
                  Something that felt wearable. Something that felt like <span className="italic text-neutral-700">you</span>.
                </motion.p>

                <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.8]">
                  So ORA became more than a brand. It became a quiet reminder — that confidence doesn&apos;t need an occasion.
                </motion.p>

                <motion.p variants={revealLine} className="text-lg md:text-xl font-serif font-light italic text-[#1A1A1A] pt-4">
                  It just needs you.
                </motion.p>
              </div>

              <motion.div variants={revealLine} className="mt-12">
                <RoseGoldDivider />
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: THE ORA MANIFESTO — Cinematic Dark Section
          Scroll-triggered line reveals · Rose gold accents
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-[140px] md:py-[180px] lg:py-[220px] bg-[#111111] text-white overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#E75480]/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#C6A85B]/5 blur-[100px]" />
        </div>
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-40" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#C6A85B]/60 mb-16 md:mb-20 font-medium"
          >
            The ORA Manifesto
          </motion.p>

          {/* Manifesto lines — each reveals on scroll */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="space-y-12 md:space-y-16"
          >
            <motion.p variants={revealLine} className="text-xl md:text-2xl lg:text-3xl font-serif font-light text-white/90 leading-relaxed">
              We believe in quiet power.
            </motion.p>

            <motion.div variants={revealLine} className="space-y-3">
              <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
                In elegance that does not ask for attention.
              </p>
              <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
                In jewellery that moves with you.
              </p>
            </motion.div>

            {/* Rose gold divider */}
            <motion.div variants={revealLine}>
              <div className="flex items-center justify-center gap-4">
                <span className="w-12 md:w-20 h-px bg-gradient-to-r from-transparent to-[#C6A85B]/30" />
                <span className="w-1 h-1 rounded-full bg-[#C6A85B]/40" />
                <span className="w-12 md:w-20 h-px bg-gradient-to-l from-transparent to-[#C6A85B]/30" />
              </div>
            </motion.div>

            <motion.div variants={revealLine} className="space-y-4">
              <p className="text-base md:text-lg font-light text-white/45 leading-relaxed">Not louder.</p>
              <p className="text-lg md:text-xl font-light text-white/75 leading-relaxed">Just stronger.</p>
            </motion.div>

            <motion.div variants={revealLine} className="space-y-4">
              <p className="text-base md:text-lg font-light text-white/45 leading-relaxed">Not heavier.</p>
              <p className="text-lg md:text-xl font-light text-white/75 leading-relaxed">Just meaningful.</p>
            </motion.div>

            {/* Highlight closing line */}
            <motion.div
              variants={revealLine}
              className="pt-8 md:pt-12"
            >
              <p className="text-2xl md:text-3xl lg:text-4xl font-serif font-light italic text-[#E75480]/80 leading-tight">
                Wear your aura.
              </p>
              {/* Animated underline */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-24 md:w-32 h-px bg-gradient-to-r from-[#E75480]/60 to-[#C6A85B]/40 mx-auto mt-4 origin-left"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: CRAFT & PHILOSOPHY — Visual + Grid
          ═══════════════════════════════════════════════════════════ */}
      <section className="py-[120px] md:py-[160px] lg:py-[200px] bg-[#F7F7F7] relative">
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-20" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left: Product macro visual */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative aspect-square bg-gradient-to-br from-white via-[#FDF2F5] to-[#F6C1CF]/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-8">
                    <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#F6C1CF]/30 to-[#C6A85B]/10 flex items-center justify-center">
                      <span className="text-4xl font-serif font-light text-[#C6A85B]/50">✦</span>
                    </div>
                    <p className="text-xs tracking-[0.3em] uppercase text-[#C6A85B]/60 font-medium">Product Macro</p>
                    <p className="text-[10px] tracking-wider text-neutral-400 mt-2">Detail · Texture · Craft</p>
                  </div>
                </div>

                {/* Corner accents */}
                <div className="absolute top-6 left-6 w-16 h-16 border-t border-l border-[#C6A85B]/15" />
                <div className="absolute bottom-6 right-6 w-16 h-16 border-b border-r border-[#C6A85B]/15" />
              </div>
            </motion.div>

            {/* Right: Philosophy bullets with hover reveal */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="order-1 lg:order-2"
            >
              <motion.p variants={revealLine} className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-[#C6A85B]/70 mb-6 font-medium">
                Our Craft
              </motion.p>

              <motion.h2 variants={fadeSlideUp} className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1A1A1A] leading-[1.15] mb-14 md:mb-16">
                Philosophy
                <br />
                <span className="text-neutral-400">&amp; Intention</span>
              </motion.h2>

              <div className="space-y-0">
                {[
                  { text: 'Luxury should feel effortless', detail: 'Not a performance. A presence.' },
                  { text: 'Minimal can be powerful', detail: 'Less noise. More meaning.' },
                  { text: 'Jewellery should move with you', detail: 'From morning coffee to midnight conversations.' },
                  { text: 'Confidence is the most beautiful accessory', detail: 'We just complement what\'s already there.' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    variants={fadeSlideLeft}
                    className="group border-b border-neutral-200/80 py-7 md:py-8 cursor-default"
                  >
                    <div className="flex items-start gap-5">
                      <span className="flex-shrink-0 w-6 h-px bg-[#C6A85B]/40 mt-3.5 group-hover:w-10 group-hover:bg-[#E75480]/60 transition-all duration-500" />
                      <div>
                        <p className="text-base md:text-lg font-light text-[#1A1A1A] leading-relaxed group-hover:text-[#E75480] transition-colors duration-500">
                          {item.text}
                        </p>
                        <p className="text-sm font-light text-neutral-400 mt-1.5 max-h-0 overflow-hidden opacity-0 group-hover:max-h-10 group-hover:opacity-100 transition-all duration-500">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: EMOTIONAL BRAND — Identity & Presence
          Ambient gradient · Editorial typography
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-[140px] md:py-[180px] lg:py-[220px] overflow-hidden">
        {/* Ambient gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FDF2F5]/40 to-white" />
        <motion.div
          animate={{
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#F6C1CF]/30 blur-[150px] pointer-events-none"
        />
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-20" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.h2
              variants={fadeSlideUp}
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-light text-[#1A1A1A] leading-[1.15] mb-6"
            >
              ORA is not decoration.
            </motion.h2>

            <motion.p
              variants={fadeSlideUp}
              className="text-xl md:text-2xl font-serif font-light italic text-[#E75480]/70 mb-16 md:mb-20"
            >
              It is presence.
            </motion.p>

            <motion.div variants={revealLine}>
              <RoseGoldDivider />
            </motion.div>

            <motion.div variants={stagger} className="mt-16 md:mt-20 space-y-7">
              <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.9]">
                It is the energy you carry into a room before you speak.
                <br />
                The quiet confidence that doesn&apos;t need announcement.
              </motion.p>

              <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.9]">
                It is identity expressed through restraint.
                <br />
                Self-expression through intention.
              </motion.p>

              <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.9]">
                For the woman who doesn&apos;t wait for occasions — she creates them.
                <br />
                Who celebrates quietly. Who invests in how she feels.
              </motion.p>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════════
          SECTION 6: CLOSING CTA — Minimal, Centered, Confident
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative py-[140px] md:py-[180px] lg:py-[200px] bg-[#111111] text-white overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-[#E75480]/5 blur-[120px]" />
        </div>
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-30" />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <motion.p
              variants={revealLine}
              className="text-lg md:text-xl font-light text-white/40 leading-relaxed mb-6"
            >
              Because jewellery isn&apos;t just what you wear.
              <br />
              It&apos;s how you feel wearing it.
            </motion.p>

            <motion.h2
              variants={fadeSlideUp}
              className="text-3xl md:text-4xl lg:text-5xl font-serif font-light italic text-white/90 leading-tight mb-16 md:mb-20"
            >
              ORA is for her.
            </motion.h2>

            <motion.div variants={fadeSlideUp}>
              <Link
                href="/collections"
                className="group inline-flex items-center gap-3 px-12 py-5 border border-white/20 text-xs md:text-sm tracking-[0.2em] uppercase font-medium text-white hover:bg-white hover:text-[#111111] transition-all duration-500"
              >
                Explore ORA
                <svg className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>

            <motion.p
              variants={revealLine}
              className="mt-16 text-[10px] tracking-[0.35em] uppercase text-[#C6A85B]/40 font-medium"
            >
              Subtle. Strong. Unforgettable.
            </motion.p>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
