/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: true,
  distDir: 'dist',
  assetPrefix: '.',
  experimental: {
    optimizeCss: false,
  },
}

export default nextConfig
