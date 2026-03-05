'use client';

/**
 * About ORA — Immersive Brand Experience
 * 
 * A deeply emotional, visually rich, scroll-driven storytelling page.
 * Color scheme: ORA Pink (#F6C1CF, #E75480), Gold (#C6A85B, #D4AF37), Dark (#111)
 */

import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';

/* ─── Animation presets ─── */
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const slideRight = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const slideLeft = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const revealLine = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Floating Particle System ─── */
function FloatingParticles({ count = 20, color = '#E75480' }: { count?: number; color?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: color,
            opacity: 0,
          }}
          animate={{
            y: [0, -(Math.random() * 100 + 50), 0],
            x: [0, (Math.random() - 0.5) * 60, 0],
            opacity: [0, Math.random() * 0.5 + 0.1, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: Math.random() * 6 + 6,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Sparkle SVG ─── */
function Sparkle({ className = '', size = 20 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
    </svg>
  );
}

/* ─── Diamond Divider ─── */
function DiamondDivider({ dark = false }: { dark?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-center gap-3 py-4"
    >
      <span className={`w-16 md:w-28 h-px ${dark ? 'bg-gradient-to-r from-transparent to-[#C6A85B]/50' : 'bg-gradient-to-r from-transparent to-[#E75480]/30'}`} />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      >
        <Sparkle size={12} className={dark ? 'text-[#C6A85B]/50' : 'text-[#E75480]/40'} />
      </motion.div>
      <span className={`w-16 md:w-28 h-px ${dark ? 'bg-gradient-to-l from-transparent to-[#C6A85B]/50' : 'bg-gradient-to-l from-transparent to-[#E75480]/30'}`} />
    </motion.div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, end]);

  return (
    <div ref={ref} className="text-center">
      <motion.p
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-[#E75480]"
      >
        {count}{suffix}
      </motion.p>
      <p className="text-xs md:text-sm tracking-[0.2em] uppercase text-neutral-400 mt-3 font-medium">{label}</p>
    </div>
  );
}

export default function AboutOraPage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <main className="bg-white min-h-screen">

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: HERO — Cinematic Full Viewport
          ═══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-[100svh] min-h-[700px] flex items-center justify-center overflow-hidden"
      >
        {/* Multi-layer animated gradient */}
        <motion.div style={{ scale: heroScale }} className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FDF2F5] via-[#FDECEF] to-[#FFF5F7]" />
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#F6C1CF]/30 to-transparent blur-[80px]"
          />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[#E75480]/10 to-transparent blur-[60px]"
          />
        </motion.div>

        {/* Floating ambient orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[15%] left-[15%] w-[300px] h-[300px] rounded-full bg-[#E75480]/10 blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -20, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] rounded-full bg-[#C6A85B]/10 blur-[80px]"
        />
        <motion.div
          animate={{ y: [0, -15, 0], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-[40%] right-[30%] w-[200px] h-[200px] rounded-full bg-[#F6C1CF]/30 blur-[60px]"
        />

        <FloatingParticles count={25} color="#E75480" />
        <FloatingParticles count={10} color="#C6A85B" />

        {/* Decorative rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full border border-[#E75480]/[0.04]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[850px] md:h-[850px] rounded-full border border-[#C6A85B]/[0.04]"
        />

        {/* Corner sparkles */}
        <motion.div
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[20%] right-[15%]"
        >
          <Sparkle size={16} className="text-[#C6A85B]/30" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-[25%] left-[18%]"
        >
          <Sparkle size={14} className="text-[#E75480]/25" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.15, 0.5, 0.15], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute top-[35%] left-[8%]"
        >
          <Sparkle size={10} className="text-[#C6A85B]/20" />
        </motion.div>

        <div className="absolute inset-0 ora-grain pointer-events-none opacity-30" />

        {/* Hero content with parallax */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-[#E75480]/15 mb-8 md:mb-10"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
              <Sparkle size={12} className="text-[#C6A85B]" />
            </motion.div>
            <span className="text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#E75480]/80 font-medium">
              The Story of ORA
            </span>
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
              <Sparkle size={12} className="text-[#C6A85B]" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif font-light text-[#1A1A1A] leading-[1.05] mb-6 md:mb-8"
          >
            Wear Your{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[#E75480] to-[#C6A85B] bg-clip-text text-transparent italic">
                Aura
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E75480]/40 to-[#C6A85B]/40 origin-left"
              />
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-base sm:text-lg md:text-xl font-light text-neutral-500 leading-relaxed max-w-lg mx-auto mb-12"
          >
            Jewellery designed for the woman
            <br />
            who already <span className="text-[#E75480] font-normal">shines</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/collections"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#E75480] to-[#E75480]/90 text-white text-xs md:text-sm tracking-[0.15em] uppercase font-medium rounded-full hover:shadow-lg hover:shadow-[#E75480]/25 hover:scale-[1.02] transition-all duration-500"
            >
              Discover the Collection
              <svg className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="#manifesto"
              className="inline-flex items-center gap-2 text-xs md:text-sm tracking-[0.15em] uppercase font-medium text-[#C6A85B] hover:text-[#E75480] transition-colors duration-500"
            >
              Read Our Story
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] tracking-[0.3em] uppercase text-[#C6A85B]/50 font-medium">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-[#C6A85B]/30 flex items-start justify-center p-1.5"
          >
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1 h-1.5 rounded-full bg-[#E75480]/50"
            />
          </motion.div>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 2: ANIMATED STATS RIBBON
          ═══════════════════════════════════════════════════ */}
      <section className="relative py-16 md:py-20 bg-gradient-to-r from-[#FDF2F5] via-white to-[#FDF2F5] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E75480]/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E75480]/15 to-transparent" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <AnimatedCounter end={100} suffix="%" label="Anti-Tarnish" />
            <AnimatedCounter end={5} suffix="-Day" label="Easy Returns" />
            <AnimatedCounter end={925} suffix="" label="Sterling Silver" />
            <AnimatedCounter end={100} suffix="%" label="Handcrafted" />
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 3: THE ORIGIN STORY
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F6C1CF]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#C6A85B]/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left: Immersive visual card */}
            <motion.div
              variants={slideRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative"
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-[#FDECEF] via-[#F6C1CF]/40 to-[#FDF2F5] shadow-xl shadow-[#F6C1CF]/20">
                <motion.div
                  animate={{
                    background: [
                      'radial-gradient(circle at 30% 40%, rgba(231,84,128,0.15) 0%, transparent 60%)',
                      'radial-gradient(circle at 70% 60%, rgba(198,168,91,0.12) 0%, transparent 60%)',
                      'radial-gradient(circle at 30% 40%, rgba(231,84,128,0.15) 0%, transparent 60%)',
                    ],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#E75480]/20 to-[#C6A85B]/15 flex items-center justify-center backdrop-blur-sm border border-white/30"
                    >
                      <span className="text-5xl md:text-6xl font-serif font-light bg-gradient-to-br from-[#E75480] to-[#C6A85B] bg-clip-text text-transparent">
                        O
                      </span>
                    </motion.div>
                    <p className="text-sm tracking-[0.25em] uppercase text-[#E75480]/50 font-medium">Est. 2024</p>
                    <p className="text-xs tracking-wider text-[#C6A85B]/40 mt-1">Chennai, India</p>
                  </div>
                </div>

                <motion.div
                  animate={{ y: [0, -10, 0], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-[15%] right-[20%]"
                >
                  <Sparkle size={14} className="text-[#C6A85B]/30" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0], opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute bottom-[20%] left-[15%]"
                >
                  <Sparkle size={10} className="text-[#E75480]/25" />
                </motion.div>

                <div className="absolute top-5 left-5 w-14 h-14 border-t-2 border-l-2 border-[#C6A85B]/20 rounded-tl-lg" />
                <div className="absolute bottom-5 right-5 w-14 h-14 border-b-2 border-r-2 border-[#E75480]/20 rounded-br-lg" />
              </div>
            </motion.div>

            {/* Right: Origin narrative */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="lg:py-8"
            >
              <motion.div variants={revealLine} className="inline-flex items-center gap-2 mb-6">
                <span className="w-8 h-px bg-[#E75480]/40" />
                <span className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-[#E75480]/70 font-medium">
                  The Beginning
                </span>
              </motion.div>

              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1A1A1A] leading-[1.15] mb-10">
                A New Generation
                <br />
                <span className="italic bg-gradient-to-r from-[#E75480] to-[#C6A85B] bg-clip-text text-transparent">
                  of Jewellery
                </span>
              </motion.h2>

              <div className="space-y-6">
                <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.85] border-l-2 border-[#F6C1CF]/60 pl-5">
                  ORA was created with a modern vision — to reimagine jewellery for today&apos;s woman. Growing up around the world of jewellery, we saw how pieces were often designed for occasions, traditions, or expectations.
                </motion.p>

                <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.85]">
                  But we wanted something <span className="text-[#E75480] font-normal">different</span>. Something that felt{' '}
                  <span className="italic text-neutral-700">effortless</span>. Something that felt{' '}
                  <span className="italic text-neutral-700">wearable</span>. Something that felt like{' '}
                  <span className="italic text-[#E75480] font-medium">you</span>.
                </motion.p>

                <motion.div variants={revealLine} className="relative bg-gradient-to-r from-[#FDECEF] to-[#FDF2F5] rounded-2xl p-6 border border-[#F6C1CF]/30">
                  <Sparkle size={14} className="absolute top-3 right-3 text-[#C6A85B]/30" />
                  <p className="text-lg md:text-xl font-serif font-light text-[#1A1A1A] leading-relaxed">
                    So ORA became more than a brand.
                    <br />
                    It became a quiet reminder —
                  </p>
                  <p className="text-lg md:text-xl font-serif font-light italic text-[#E75480] mt-2">
                    that confidence doesn&apos;t need an occasion.
                    <br />
                    It just needs you.
                  </p>
                </motion.div>
              </div>

              <motion.div variants={revealLine} className="mt-10">
                <DiamondDivider />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 4: THE ORA MANIFESTO — Cinematic Dark
          ═══════════════════════════════════════════════════ */}
      <section id="manifesto" className="relative py-28 md:py-36 lg:py-44 bg-[#0A0A0A] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ opacity: [0.08, 0.15, 0.08], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-[#E75480]/10 blur-[150px]"
          />
          <motion.div
            animate={{ opacity: [0.05, 0.12, 0.05] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute bottom-[-10%] right-1/4 w-[500px] h-[500px] rounded-full bg-[#C6A85B]/[0.08] blur-[120px]"
          />
          <motion.div
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-1/3 left-[10%] w-[300px] h-[300px] rounded-full bg-[#E75480]/5 blur-[80px]"
          />
        </div>

        <FloatingParticles count={15} color="#C6A85B" />
        <FloatingParticles count={10} color="#E75480" />
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-40" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-3 mb-16 md:mb-20"
          >
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-8 h-px bg-[#C6A85B]/40 origin-right"
            />
            <span className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#C6A85B] font-medium">
              The ORA Manifesto
            </span>
            <motion.span
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-8 h-px bg-[#C6A85B]/40 origin-left"
            />
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="space-y-12 md:space-y-16"
          >
            <motion.p variants={revealLine} className="text-2xl md:text-3xl lg:text-4xl font-serif font-light text-white/90 leading-relaxed">
              We believe in{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#E75480]">quiet power</span>
                <span className="absolute bottom-1 left-0 right-0 h-px bg-[#E75480]/30" />
              </span>.
            </motion.p>

            <motion.div variants={revealLine} className="space-y-4">
              <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">
                In the kind of elegance that doesn&apos;t need attention —
              </p>
              <p className="text-base md:text-lg font-light text-white/70 leading-relaxed">
                but <span className="text-[#C6A85B]">receives it anyway</span>.
              </p>
            </motion.div>

            <motion.div variants={revealLine} className="space-y-3">
              <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">We believe in celebrating small wins.</p>
              <p className="text-base md:text-lg font-light text-white/50 leading-relaxed">In dressing up for no reason.</p>
              <p className="text-base md:text-lg font-light text-white/60 leading-relaxed">
                In choosing <span className="text-[#E75480]/80">confidence</span> daily.
              </p>
            </motion.div>

            <motion.div variants={revealLine}>
              <DiamondDivider dark />
            </motion.div>

            <motion.div variants={revealLine} className="space-y-3">
              <p className="text-lg md:text-xl font-light text-white/40 leading-relaxed">We believe jewellery is not decoration.</p>
              <p className="text-xl md:text-2xl font-serif font-light italic text-[#C6A85B]/80 leading-relaxed">It is expression.</p>
            </motion.div>

            <motion.div variants={revealLine} className="grid grid-cols-2 gap-8 max-w-md mx-auto">
              <div className="text-right">
                <p className="text-base md:text-lg font-light text-white/35">Not louder.</p>
                <p className="text-lg md:text-xl font-medium text-white/80 mt-1">Just <span className="text-[#E75480]">stronger</span>.</p>
              </div>
              <div className="text-left">
                <p className="text-base md:text-lg font-light text-white/35">Not heavier.</p>
                <p className="text-lg md:text-xl font-medium text-white/80 mt-1">Just <span className="text-[#C6A85B]">meaningful</span>.</p>
              </div>
            </motion.div>

            <motion.div variants={revealLine} className="pt-8 md:pt-12">
              <motion.p
                className="text-3xl md:text-4xl lg:text-5xl font-serif font-light italic leading-tight"
                style={{
                  background: 'linear-gradient(135deg, #E75480 0%, #C6A85B 50%, #E75480 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% 200%',
                }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                Wear your aura.
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-24 md:w-32 h-[2px] bg-gradient-to-r from-[#E75480]/80 to-[#C6A85B]/60 mx-auto mt-4 origin-center rounded-full"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 5: FOR THE MODERN WOMAN
          ═══════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 lg:py-44 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDF2F5] via-white to-[#FDECEF]" />
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15], x: [0, 30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-[#F6C1CF]/25 to-[#E75480]/10 blur-[150px] pointer-events-none"
        />
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-20" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={revealLine} className="inline-flex items-center gap-2 mb-6">
              <Sparkle size={10} className="text-[#E75480]/40" />
              <span className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-[#E75480]/70 font-medium">Our Muse</span>
              <Sparkle size={10} className="text-[#E75480]/40" />
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif font-light text-[#1A1A1A] leading-[1.15] mb-12"
            >
              For The <span className="italic bg-gradient-to-r from-[#E75480] to-[#C6A85B] bg-clip-text text-transparent">Modern</span> Woman
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
              {[
                {
                  emoji: '✨',
                  title: 'She creates moments',
                  text: "She doesn't wait for occasions. She creates them.",
                  gradient: 'from-[#FDECEF] to-[#FDF2F5]',
                  border: 'border-[#E75480]/10',
                },
                {
                  emoji: '💎',
                  title: 'She chooses herself',
                  text: 'She celebrates quietly. She invests in how she feels.',
                  gradient: 'from-[#FDF2F5] to-[#F9F5EB]',
                  border: 'border-[#C6A85B]/10',
                },
                {
                  emoji: '🌸',
                  title: 'She is enough',
                  text: 'She knows confidence is the most beautiful accessory.',
                  gradient: 'from-[#F9F5EB] to-[#FDECEF]',
                  border: 'border-[#E75480]/10',
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  className={`group relative bg-gradient-to-br ${card.gradient} rounded-2xl p-8 border ${card.border} hover:shadow-xl transition-all duration-500`}
                >
                  <motion.span
                    className="text-3xl block mb-4"
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    {card.emoji}
                  </motion.span>
                  <h3 className="text-lg font-serif font-medium text-[#1A1A1A] mb-3">{card.title}</h3>
                  <p className="text-sm font-light text-neutral-500 leading-relaxed">{card.text}</p>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#E75480]/20 to-transparent group-hover:w-24 group-hover:via-[#E75480]/40 transition-all duration-500" />
                </motion.div>
              ))}
            </div>

            <motion.p variants={fadeUp} className="text-2xl md:text-3xl font-serif font-light italic text-[#E75480] leading-relaxed">
              ORA is for her.
            </motion.p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 6: WHAT ORA MEANS
          ═══════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 lg:py-44 bg-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F6C1CF]/40 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
            >
              <motion.div variants={revealLine} className="inline-flex items-center gap-2 mb-6">
                <span className="w-8 h-px bg-[#C6A85B]/40" />
                <span className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-[#C6A85B]/70 font-medium">Our Essence</span>
              </motion.div>

              <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1A1A1A] leading-[1.15] mb-10">
                What ORA<br />
                <span className="italic bg-gradient-to-r from-[#C6A85B] to-[#E75480] bg-clip-text text-transparent">Means</span>
              </motion.h2>

              <div className="space-y-6">
                <motion.p variants={revealLine} className="text-xl md:text-2xl font-serif font-light italic text-[#E75480]/80">
                  ORA represents presence.
                </motion.p>
                <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.85]">
                  It is the energy you carry into a room before you speak.
                  The confidence you don&apos;t need to announce.
                  The glow that comes from within.
                </motion.p>
                <motion.p variants={revealLine} className="text-base md:text-[17px] font-light text-neutral-500 leading-[1.85]">
                  Our jewellery is designed to complement that energy —
                  <br />
                  <span className="text-[#C6A85B] font-normal">never compete with it</span>.
                </motion.p>
              </div>
            </motion.div>

            <motion.div
              variants={slideLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="relative"
            >
              <div className="relative aspect-square rounded-3xl overflow-hidden">
                <motion.div
                  animate={{
                    background: [
                      'linear-gradient(135deg, #FDECEF 0%, #F6C1CF 30%, #FDF2F5 60%, #F9F5EB 100%)',
                      'linear-gradient(225deg, #F9F5EB 0%, #FDF2F5 30%, #F6C1CF 60%, #FDECEF 100%)',
                      'linear-gradient(135deg, #FDECEF 0%, #F6C1CF 30%, #FDF2F5 60%, #F9F5EB 100%)',
                    ],
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0"
                />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-48 h-48 mx-auto mb-8">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border border-[#E75480]/15"
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-4 rounded-full border border-[#C6A85B]/15"
                      />
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-8 rounded-full border border-[#E75480]/10"
                      />
                      <div className="absolute inset-12 rounded-full bg-gradient-to-br from-[#E75480]/10 to-[#C6A85B]/10 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-4xl font-serif font-light bg-gradient-to-br from-[#E75480] to-[#C6A85B] bg-clip-text text-transparent">✦</span>
                      </div>
                    </div>
                    <motion.p
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="text-sm tracking-[0.4em] uppercase text-[#E75480]/40 font-medium"
                    >
                      Presence · Energy · Light
                    </motion.p>
                  </div>
                </div>

                {[
                  { top: '12%', left: '18%', delay: 0, size: 12 },
                  { top: '25%', right: '15%', delay: 1.5, size: 10 },
                  { bottom: '20%', left: '25%', delay: 0.8, size: 8 },
                  { bottom: '15%', right: '20%', delay: 2, size: 14 },
                ].map((pos, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: pos.delay }}
                    className="absolute"
                    style={{ top: (pos as any).top, left: (pos as any).left, right: (pos as any).right, bottom: (pos as any).bottom }}
                  >
                    <Sparkle size={pos.size} className="text-[#C6A85B]/25" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 7: OUR PHILOSOPHY — Interactive List
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 lg:py-40 bg-gradient-to-b from-[#FAFAF9] to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A85B]/15 to-transparent" />
        <motion.div
          animate={{ opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#F6C1CF]/20 blur-[120px] pointer-events-none"
        />

        <div className="relative max-w-4xl mx-auto px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="text-center mb-16 md:mb-20"
          >
            <motion.div variants={revealLine} className="inline-flex items-center gap-2 mb-4">
              <Sparkle size={10} className="text-[#C6A85B]/40" />
              <span className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-[#C6A85B]/70 font-medium">What We Stand For</span>
              <Sparkle size={10} className="text-[#C6A85B]/40" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl lg:text-5xl font-serif font-light text-[#1A1A1A] leading-[1.15]">
              Our <span className="italic bg-gradient-to-r from-[#E75480] to-[#C6A85B] bg-clip-text text-transparent">Philosophy</span>
            </motion.h2>
          </motion.div>

          <div className="space-y-0">
            {[
              { title: 'Luxury should feel effortless', detail: 'Not a performance. A presence. Every piece feels like it was always meant to be yours.', icon: '✦', color: '#E75480' },
              { title: 'Minimal can be powerful', detail: 'Less noise. More meaning. Elegance is in the restraint, not the excess.', icon: '◇', color: '#C6A85B' },
              { title: 'Jewellery should move with you', detail: 'From morning coffee to midnight conversations — every piece travels your journey.', icon: '○', color: '#E75480' },
              { title: 'Confidence is the most beautiful accessory', detail: "We don't add to who you are. We complement what's already there.", icon: '❋', color: '#C6A85B' },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                whileHover={{ x: 8 }}
                className="group border-b border-neutral-200/60 py-8 md:py-10 cursor-default"
              >
                <div className="flex items-start gap-6">
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 180 }}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-500"
                    style={{ background: `${item.color}10`, color: item.color }}
                  >
                    {item.icon}
                  </motion.span>
                  <div className="flex-1">
                    <p className="text-lg md:text-xl font-serif font-light text-[#1A1A1A] leading-relaxed group-hover:text-[#E75480] transition-colors duration-500">
                      {item.title}
                    </p>
                    <p className="text-sm font-light text-neutral-400 mt-2 overflow-hidden max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500">
                      {item.detail}
                    </p>
                  </div>
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500"
                    style={{ background: `${item.color}10` }}
                  >
                    <svg className="w-4 h-4" style={{ color: item.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mt-12"
          >
            <p className="text-base md:text-lg font-light text-neutral-400 italic">
              Every ORA piece is curated to elevate <span className="text-[#E75480]">everyday moments</span>.
            </p>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════
          SECTION 8: CLOSING CTA — Dark & Powerful
          ═══════════════════════════════════════════════════ */}
      <section className="relative py-32 md:py-40 lg:py-48 bg-[#0A0A0A] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#E75480]/[0.08] blur-[150px]"
          />
          <motion.div
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-[#C6A85B]/5 blur-[100px]"
          />
        </div>
        <FloatingParticles count={12} color="#C6A85B" />
        <div className="absolute inset-0 ora-grain pointer-events-none opacity-30" />

        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <motion.p variants={revealLine} className="text-base md:text-lg font-light text-white/40 leading-relaxed mb-4">
              Because jewellery isn&apos;t just what you wear.
            </motion.p>
            <motion.p variants={revealLine} className="text-base md:text-lg font-light text-white/50 leading-relaxed mb-10">
              It&apos;s how you feel wearing it.
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-light italic leading-tight mb-12"
              style={{
                background: 'linear-gradient(135deg, #E75480 0%, #F6C1CF 40%, #C6A85B 70%, #E75480 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '300% 300%',
              }}
            >
              ORA is for her.
            </motion.h2>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/collections"
                className="group inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-[#E75480] to-[#E75480]/90 text-white text-xs md:text-sm tracking-[0.15em] uppercase font-medium rounded-full hover:shadow-lg hover:shadow-[#E75480]/20 hover:scale-[1.02] transition-all duration-500"
              >
                Explore ORA
                <svg className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 px-10 py-4 border border-white/20 text-xs md:text-sm tracking-[0.15em] uppercase font-medium text-white/80 rounded-full hover:bg-white/5 hover:border-[#C6A85B]/30 transition-all duration-500"
              >
                Get in Touch
              </Link>
            </motion.div>

            <motion.div variants={revealLine} className="mt-16">
              <DiamondDivider dark />
              <p className="mt-4 text-[10px] tracking-[0.35em] uppercase text-[#C6A85B]/40 font-medium">
                Subtle · Strong · Unforgettable
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
