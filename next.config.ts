import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Set turbopack root to silence workspace root warning
  turbopack: {
    root: path.resolve(__dirname),
  },
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // 性能优化
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  compress: true,
  poweredByHeader: false,
  // 严格模式确保 SSR/CSR 一致性
  reactStrictMode: true,
  // 生产环境优化
  productionBrowserSourceMaps: false,
};

export default nextConfig;
