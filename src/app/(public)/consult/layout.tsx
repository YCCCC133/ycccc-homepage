import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '智能咨询',
  description: 'AI智能法律咨询，24小时在线提供专业法律指引',
};

export default function ConsultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
