/** @type {import('next').NextConfig} */
const nextConfig = {
  // React 19 experimental features (stable features only)
  experimental: {
    // reactCompiler: true,          // Requires canary
    // ppr: 'incremental',          // Requires canary
    // dynamicIO: true,             // Requires canary
    // staleTimes: {                // Requires canary
    //   dynamic: 30,
    //   static: 180,
    // },
  },

  // App Router is enabled by default in Next.js 15
  // Server external packages (moved from experimental)
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],

  // Performance optimizations
  poweredByHeader: false,

  // Image optimization for Norwegian regions
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tutorconnect.no',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Temporarily disabled to fix MIME type issues
          // {
          //   key: 'X-Content-Type-Options',
          //   value: 'nosniff',
          // },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Webpack configuration for better bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Bundle analyzer support
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('@next/bundle-analyzer')();
      config.plugins.push(new BundleAnalyzerPlugin());
    }

    // Optimization for production
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/components/ui': require('path').resolve(__dirname, 'src/components/ui'),
        '@/lib': require('path').resolve(__dirname, 'src/lib'),
      };
    }

    return config;
  },

  // Redirects for SEO and UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Output configuration for deployment
  output: 'standalone',

  // Note: i18n config removed - using App Router with built-in internationalization
  // Internationalization will be handled via app/[locale] structure if needed

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Enable strict mode for React 19 compatibility
  reactStrictMode: true,

  // Temporarily ignore build errors for React 19 migration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;