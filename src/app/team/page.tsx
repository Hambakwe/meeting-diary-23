'use client';

import { PortalLayout } from '@/components/PortalLayout';
import { TeamContacts } from '@/components/TeamContacts';
import { Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

export default function Team() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      <PortalLayout>
        <TeamContacts />
      </PortalLayout>
    </>
  );
}
