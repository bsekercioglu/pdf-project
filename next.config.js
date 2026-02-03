/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pdf2pic', 'sharp', 'tesseract.js'],
  },
};

module.exports = nextConfig;
