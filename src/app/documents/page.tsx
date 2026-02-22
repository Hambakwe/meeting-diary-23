'use client';

import { PortalLayout } from '@/components/PortalLayout';
import { DocumentLibrary } from '@/components/DocumentLibrary';
import { Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

export default function Documents() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      <PortalLayout>
        <DocumentLibrary />
      </PortalLayout>
    </>
  );
}
