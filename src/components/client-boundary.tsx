'use client';

import { useState, useEffect } from 'react';

interface ClientBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * ClientBoundary - A wrapper component that ensures consistent SSR/CSR rendering
 * 
 * This component prevents hydration mismatches by:
 * 1. Rendering `fallback` (or null) on the server
 * 2. Rendering `fallback` (or null) on initial client render (before hydration)
 * 3. Only rendering `children` after hydration is complete
 */
export function ClientBoundary({ children, fallback = null }: ClientBoundaryProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Simple loading fallback component
 */
export function LoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary mx-auto mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}
