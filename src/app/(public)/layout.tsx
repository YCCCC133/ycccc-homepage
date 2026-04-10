import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import PolicyPopup from '@/components/policy-popup';

// Public layout: includes Navigation, Footer, and PolicyPopup
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
      <PolicyPopup />
    </div>
  );
}
