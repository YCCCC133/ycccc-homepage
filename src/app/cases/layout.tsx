import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '案件查询',
  description: '实时追踪案件进度，掌握维权动态',
};

export default function CasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
