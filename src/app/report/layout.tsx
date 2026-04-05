import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '线索填报',
  description: '在线填报欠薪线索，快速启动维权流程',
};

export default function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
