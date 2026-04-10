import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '文书生成',
  description: '一键生成起诉状、支持起诉书等法律文书',
};

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
