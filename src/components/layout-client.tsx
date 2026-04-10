'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import PolicyPopup from '@/components/policy-popup';

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin');
}

export function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = isAdminRoute(pathname);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
      <PolicyPopup />
    </div>
  );
}
