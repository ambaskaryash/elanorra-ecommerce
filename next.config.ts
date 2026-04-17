const nextConfig = {
  experimental: {
    optimizeCss: false,
  },
  // No custom webpack workaround; relying on Next 16 defaults
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization for production performance
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'medusa-public-images.s3.eu-west-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://checkout.razorpay.com https://js.razorpay.com https://js.stripe.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://tracking.anifun.store",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
              "connect-src 'self' https://api.elanorraliving.in https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://api.clerk.com https://*.api.clerk.com https://tracking.anifun.store",
              "frame-src 'self' https://checkout.razorpay.com https://js.stripe.com https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ],
      },
    ];
  },
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_RYBBIT_HOST;
    if (!base || !(base.startsWith('http://') || base.startsWith('https://'))) {
      return [];
    }
    return [
      {
        source: "/api/script.js",
        destination: `${base}/api/script.js`,
      },
      {
        source: "/api/track",
        destination: `${base}/api/track`,
      },
    ];
  },
};

export default nextConfig;
