import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '在线申请',
  description: '在线申请支持起诉、法律援助，全流程在线办理',
};

export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
