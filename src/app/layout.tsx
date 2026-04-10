import type { Metadata, Viewport } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import PolicyPopup from '@/components/policy-popup';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e40af' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: '护薪平台 - 检察支持起诉智能平台',
    template: '%s | 护薪平台',
  },
  description:
    '保障劳动者（特别是农民工）薪酬权益，帮助诉讼能力弱的劳动者追讨欠薪。提供线索填报、智能咨询、文书生成、在线申请等一站式法律服务。',
  keywords: [
    '护薪平台',
    '农民工维权',
    '检察支持起诉',
    '薪酬权益',
    '法律援助',
    '西城区人民检察院',
    '智能法律咨询',
    '法律文书生成',
  ],
  authors: [{ name: '北京市西城区人民检察院' }],
  generator: '护薪检察支持起诉智能平台',
  openGraph: {
    title: '护薪平台 | 检察支持起诉智能平台',
    description:
      '保障劳动者薪酬权益，帮助诉讼能力弱的劳动者追讨欠薪。全国模范检察院倾力打造。',
    siteName: '护薪平台',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/* DNS 预连接优化 */}
        <link rel="preconnect" href="https://fonts.googleapis.cn" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.cn" crossOrigin="anonymous" />
      </head>
      <body className="antialiased bg-background">
        {isDev && <Inspector />}
        <div className="flex min-h-screen flex-col bg-background">
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        {/* 用户协议浮窗 */}
        <PolicyPopup />
      </body>
    </html>
  );
}
