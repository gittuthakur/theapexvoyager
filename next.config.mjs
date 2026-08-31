/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.3'],
  // Narrow, framework-native headers with no known compatibility risk for this app
  // (no iframe embedding in either direction, no cross-origin auth flow depending on
  // full-URL referrers) — deliberately not a CSP, which needs per-script/style
  // auditing to add safely and isn't attempted here.
  // A config-level redirect (resolved by Next's routing layer before any page ever
  // renders) rather than permanentRedirect() inside app/journeys/[slug]/page.tsx —
  // that route has a loading.tsx, and an in-component redirect was observed returning
  // HTTP 200 on the wire because the async render started streaming the loading shell
  // before the redirect check resolved. See app/journeys/[slug]/page.tsx for the full
  // history of this slug.
  async redirects() {
    return [
      {
        source: '/journeys/sikkim-mountain-escape',
        destination: '/journeys/uttarakhand-explorer',
        permanent: true
      }
    ];
  },
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