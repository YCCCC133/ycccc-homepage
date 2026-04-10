// Admin layout: no Navigation/Footer to avoid hydration issues
// The admin page itself is a client component with proper hydration handling
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
