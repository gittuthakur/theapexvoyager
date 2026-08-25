/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.3'],
  // Narrow, framework-native headers with no known compatibility risk for this app
  // (no iframe embedding in either direction, no cross-origin auth flow depending on
  // full-URL referrers) — deliberately not a CSP, which needs per-script/style
  // auditing to add safely and isn't attempted here.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
        ]
      }
    ];
  },
  images: {
    localPatterns: [
      {
        pathname: '/**', // Isse /images/* aur /api/* dono allow ho jayenge
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;