/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  theme: {
    colors: {
      /* ============================================
         ORA SEMANTIC COLOR TOKENS
         Primary: Blush Pink (#EC4899 + shades)
         Accent: Champagne Gold (#D4AF37)
         Background: Warm Ivory (#FDFBF7)
         Text: Dark Charcoal (#1A1A1A)
         ============================================ */
      
      // Core Brand Colors
      transparent: 'transparent',
      white: '#FFFFFF',
      black: '#000000',
      
      // Semantic Layers
      background: '#FFFFFF', // White background (storefront - clean luxury - REQUIRED FOR PREMIUM FEEL)
      foreground: '#1A1A1A', // Dark charcoal text
      
      // Primary Brand Color (Blush Pink)
      primary: {
        DEFAULT: '#ec4899',  // Primary pink (brand) - for bg-primary, text-primary fallback
        50: '#fdf2f8',   // Lightest blush
        100: '#fce7f3',  // Very light blush
        200: '#fbcfe8',  // Light blush
        300: '#f8b4e6',  // Blush
        400: '#f472b6',  // Medium pink
        500: '#ec4899',  // Primary pink (brand)
        600: '#db2777',  // Deep pink / hover
        700: '#be185d',  // Dark pink
        800: '#9d174d',  // Very dark pink
        900: '#831843',  // Darkest pink
      },
      
      // Secondary: Champagne Gold
      secondary: {
        DEFAULT: '#d4af37',  // Champagne gold - for bg-secondary, text-secondary fallback
        50: '#fef9f0',
        100: '#fef3e1',
        200: '#fce3c3',
        300: '#f9d4a5',
        400: '#f4b869',
        500: '#d4af37',   // Champagne gold
        600: '#c19b2f',
        700: '#a67c25',
        800: '#8b621d',
        900: '#704815',
      },
      
      // Neutral/Gray (for secondary text, borders)
      neutral: {
        DEFAULT: '#78716b',  // For text-neutral, bg-neutral fallback
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716b',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
      },
      
      // Semantic Colors
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      
      // Red Color Palette (for badges/alerts)
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
      },
      
      // Gray Color Palette (required for UI elements)
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
      },
      
      // Rose Color Palette (for auth pages)
      rose: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337',
      },
      
      // Pink Color Palette
      pink: {
        50: '#fdf2f8',
        100: '#fce7f3',
        200: '#fbcfe8',
        300: '#f9a8d4',
        400: '#f472b6',
        500: '#ec4899',
        600: '#db2777',
        700: '#be185d',
        800: '#9d174d',
        900: '#831843',
      },
      
      // Amber Color Palette
      amber: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      
      // Emerald Color Palette
      emerald: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },
      
      // Purple Color Palette
      purple: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
        800: '#6b21a8',
        900: '#581c87',
      },
      
      // Blue Color Palette
      blue: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
      },
      
      // Yellow Color Palette
      yellow: {
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
      },
      
      // Teal Color Palette
      teal: {
        50: '#f0fdfa',
        100: '#ccfbf1',
        200: '#99f6e4',
        300: '#5eead4',
        400: '#2dd4bf',
        500: '#14b8a6',
        600: '#0d9488',
        700: '#0f766e',
        800: '#115e59',
        900: '#134e4a',
      },
      
      // Indigo Color Palette
      indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
      },
      
      // Cyan Color Palette
      cyan: {
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
      },
      
      // Orange Color Palette
      orange: {
        50: '#fff7ed',
        100: '#ffedd5',
        200: '#fed7aa',
        300: '#fdba74',
        400: '#fb923c',
        500: '#f97316',
        600: '#ea580c',
        700: '#c2410c',
        800: '#9a3412',
        900: '#7c2d12',
      },
      
      // Stone Color Palette (for dark backgrounds)
      stone: {
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
        950: '#0c0a09',
      },
      
      // Semantic Color Aliases for Components (DO NOT USE bg-text-primary etc directly)
      'text-primary': '#1A1A1A',     // Dark charcoal = foreground
      'text-secondary': '#78716b',   // neutral-500
      'text-muted': '#a8a29e',       // neutral-400
      'accent': '#d4af37',           // Champagne gold = secondary-500
      'background-white': '#FFFFFF', // White background
      border: '#E5E5E5',             // Default border color
      
      // Component-Specific Tokens
      card: {
        bg: '#FFFFFF',      // White cards on white background
        border: '#E5E5E5',  // Subtle neutral border (not pink)
        hover: '#F9F9F9',   // Very subtle gray hover
      },
      
      input: {
        bg: '#FFFFFF',
        border: '#E5E5E5',
        focus: '#ec4899',   // Primary pink focus
      },
      
      button: {
        primary: '#ec4899',        // Brand pink
        'primary-hover': '#db2777', // Deep pink
        secondary: '#d4af37',      // Gold
        ghost: 'transparent',
      },
      
      badge: {
        new: '#fce7f3',     // Light pink bg
        bestseller: '#ec4899', // Pink
        sale: '#ef4444',    // Red
      },
    },
    
    extend: {
      borderRadius: {
        luxury: '12px',
        'luxury-lg': '16px',
      },
      
      boxShadow: {
        luxury: '0 4px 12px rgba(0, 0, 0, 0.08)',
        'luxury-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'luxury-hover': '0 12px 32px rgba(0, 0, 0, 0.16)',
      },
      
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1.1' }],
        'display-md': ['2.5rem', { lineHeight: '1.2' }],
        'display-sm': ['2rem', { lineHeight: '1.3' }],
      },
      
      animation: {
        skeleton: 'skeleton 2s ease-in-out infinite',
      },
      
      keyframes: {
        skeleton: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  
  plugins: [],
};

