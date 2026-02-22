'use client';

import { PortalLayout } from '@/components/PortalLayout';
import { Dashboard } from '@/components/Dashboard';
import { Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

export default function Home() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      <PortalLayout>
        <Dashboard />
      </PortalLayout>
    </>
  );
}
