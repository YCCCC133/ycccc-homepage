'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Wrapper component that handles hydration properly
export default function AdminAuthWrapper({ 
  children, 
  isAuthenticated, 
  isLoading,
  authChecked 
}: { 
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading: boolean;
  authChecked: boolean;
}) {
  // Always render the same structure on server and client initially
  // to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Before mounting, show consistent loading state
  if (!mounted || !authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50/50 to-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // After mounted and auth checked, render children
  return <>{children}</>;
}
