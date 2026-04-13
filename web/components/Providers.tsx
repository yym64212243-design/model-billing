'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/lib/locale';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </SessionProvider>
  );
}
