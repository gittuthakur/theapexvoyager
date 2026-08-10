const nextConfig = {
  reactStrictMode: true,
  // Lets the dev server (next dev) accept requests from these origins — needed for
  // LAN/mobile testing (e.g. opening http://192.168.1.3:3000 from a phone on the same network).
  // Add any other machine/device IPs you test from to this list.
  allowedDevOrigins: ['192.168.1.3'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  }
};

export default nextConfig;
