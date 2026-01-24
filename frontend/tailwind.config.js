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

