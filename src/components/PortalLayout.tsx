'use client';

import { useState, useEffect } from 'react';
import { PortalSidebar } from '@/components/PortalSidebar';
import { useAuth } from '@/components/AuthProvider';
import { LoginDialog } from '@/components/LoginDialog';
import { cn } from '@/lib/utils';

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show login dialog if not authenticated
  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      setLoginOpen(true);
    }
  }, [mounted, loading, isAuthenticated]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-teal-600/30" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900">
      <PortalSidebar />

      {/* Main Content Area */}
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'lg:ml-64', // Sidebar width on desktop
          'pt-14 lg:pt-0' // Top padding for mobile header bar
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-teal-600 animate-pulse mx-auto mb-4" />
                <p className="text-stone-500 dark:text-stone-400">Loading...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Login Dialog */}
      <LoginDialog
        open={loginOpen && !isAuthenticated}
        onOpenChange={setLoginOpen}
      />
    </div>
  );
}
