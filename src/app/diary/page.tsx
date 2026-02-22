'use client';

import { PortalLayout } from '@/components/PortalLayout';
import { Diary } from '@/components/Diary';
import { Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

export default function DiaryPage() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <Toaster position="top-right" richColors theme={resolvedTheme === 'dark' ? 'dark' : 'light'} />
      <PortalLayout>
        <Diary />
      </PortalLayout>
    </>
  );
}
