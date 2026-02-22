'use client';

import { PortalLayout } from '@/components/PortalLayout';
import { TimelinePage } from '@/components/TimelinePage';
import { Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

export default function Timeline() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      <PortalLayout>
        <TimelinePage />
      </PortalLayout>
    </>
  );
}
