/**
 * ORA Admin Panel - Design System Theme
 * =====================================
 * 
 * Premium Jewellery Brand Theme
 * Inspired by Shopify Admin UX
 * 
 * Primary: Soft Rose / Blush Pink
 * Accent: Champagne Gold
 * Background: Off-white / Light Beige
 */

export const adminTheme = {
  // ============================================
  // CORE COLORS
  // ============================================
  colors: {
    // Primary Brand - Soft Rose / Blush Pink
    primary: {
      50: '#FDF2F8',
      100: '#FCE7F3',
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#EC4899',  // Main brand color
      600: '#DB2777',
      700: '#BE185D',
      800: '#9D174D',
      900: '#831843',
    },
    
    // Accent - Champagne Gold
    gold: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#D4AF37',  // Champagne Gold
      600: '#B8960A',
      700: '#8B7310',
      800: '#5F4E0D',
      900: '#3D320A',
    },
    
    // Neutral - Warm Grays (for text, borders)
    neutral: {
      50: '#FAFAF9',
      100: '#F5F5F4',
      200: '#E7E5E4',
      300: '#D6D3D1',
      400: '#A8A29E',
      500: '#78716C',
      600: '#57534E',
      700: '#44403C',
      800: '#292524',
      900: '#1C1917',
    },
    
    // Background variations
    background: {
      primary: '#FDFBF7',    // Off-white / Light Beige
      secondary: '#F7F5F0',  // Slightly darker beige
      tertiary: '#FFFFFF',   // Pure white for cards
      elevated: '#FFFFFF',   // Elevated surfaces
    },
    
    // Text colors
    text: {
      primary: '#1C1917',    // Charcoal / Dark Gray
      secondary: '#57534E',  // Medium gray
      tertiary: '#78716C',   // Light gray
      muted: '#A8A29E',      // Very light gray
      inverse: '#FFFFFF',    // White text
    },
    
    // Semantic colors
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      500: '#10B981',  // Emerald Green
      600: '#059669',
      700: '#047857',
    },
    
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      500: '#F59E0B',  // Amber
      600: '#D97706',
      700: '#B45309',
    },
    
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',  // Soft Red
      600: '#DC2626',
      700: '#B91C1C',
    },
    
    info: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
    },
    
    // Border colors
    border: {
      light: '#E7E5E4',
      default: '#D6D3D1',
      dark: '#A8A29E',
    },
  },
  
  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: '"Cormorant Garamond", Georgia, serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    },
  },
  
  // ============================================
  // SPACING
  // ============================================
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // ============================================
  // BORDER RADIUS
  // ============================================
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    default: '0.5rem', // 8px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },
  
  // ============================================
  // TRANSITIONS
  // ============================================
  transitions: {
    fast: '150ms ease',
    default: '200ms ease',
    slow: '300ms ease',
  },
  
  // ============================================
  // Z-INDEX
  // ============================================
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
  
  // ============================================
  // BREAKPOINTS
  // ============================================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // ============================================
  // LAYOUT
  // ============================================
  layout: {
    sidebarWidth: '260px',
    sidebarCollapsedWidth: '64px',
    headerHeight: '64px',
    contentMaxWidth: '1440px',
  },
};

// Type definitions
export type AdminTheme = typeof adminTheme;
export type ThemeColors = typeof adminTheme.colors;

export default adminTheme;
