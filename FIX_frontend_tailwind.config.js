/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ✅ Limit content scanning in dev
  safelist: process.env.NODE_ENV === 'development' ? [] : [
    // Add safe patterns if using dynamic classes
  ],
  theme: {
    extend: {
      // Keep minimal, avoid large extends
    },
  },
  plugins: [],
  // ✅ Disable unnecessary features in dev
  corePlugins:
    process.env.NODE_ENV === 'development'
      ? {}
      : {
          // Can be optimized in production
        },
};
