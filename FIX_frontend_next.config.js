/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standard output instead of standalone to reduce memory footprint in dev
  // output: 'standalone', // ❌ Remove for dev, use only for production containers
  
  // Development-specific optimizations
  ...(process.env.NODE_ENV === 'development' && {
    // Disable SWC minification in dev to reduce memory
    swcMinify: false,
    // Reduce re-rendering of unchanged pages
    productionBrowserSourceMaps: false,
  }),
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Limit concurrent image optimization processes
    concurrency: 2,
    // Cache optimized images
    cacheMaxAge: 31536000,
  },
  
  // Webpack optimization for dev
  webpack: (config, { isServer, dev }) => {
    if (dev) {
      // Disable memory-intensive source maps in development
      config.devtool = false;
      
      // Reduce chunk size
      config.optimization = {
        ...config.optimization,
        minimize: false,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              filename: 'vendor.js',
              test: /node_modules/,
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    return config;
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  },
  
  // Reduce concurrent requests
  experimental: {
    isrMemoryCacheSize: 5, // Reduce ISR memory cache
  },
};

module.exports = nextConfig;
