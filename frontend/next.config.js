/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects for backward compatibility
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/admin/login',
        destination: '/auth/login',
        permanent: true,
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      // Cloudflare R2 CDN (primary)
      {
        protocol: 'https',
        hostname: 'cdn.orashop.in',
      },
      // Allow any subdomain of the CDN
      {
        protocol: 'https',
        hostname: '**.orashop.in',
      },
      // R2 direct access (for development/testing)
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      // R2 public development URL (r2.dev)
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      // Legacy: Cloudinary
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Legacy: Supabase Storage (for migration period)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      // Unsplash (for demo/mock images)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
    // Optimize image formats
    formats: ['image/webp', 'image/avif'],
    // Cache images for 1 year (immutable)
    minimumCacheTTL: 31536000,
    // Device sizes for srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.orashop.in',
  },
};

module.exports = nextConfig;
