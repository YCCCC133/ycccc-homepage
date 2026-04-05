import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // outputFileTracingRoot: path.resolve(__dirname, '../../'),  // Uncomment and add 'import path from "path"' if needed
  /* config options here */
  allowedDevOrigins: ['*.dev.coze.site'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
    ],
    // 图片优化配置
    formats: ['image/avif', 'image/webp'],
  },
  // 性能优化
  experimental: {
    // 优化包大小
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // 压缩配置
  compress: true,
  // 生产环境优化
  poweredByHeader: false,
};

export default nextConfig;
