/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.1.3'],
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