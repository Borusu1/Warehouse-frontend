import { PropsWithChildren } from 'react';

import { AuthProvider } from '@/src/providers/AuthProvider';
import { LocaleProvider } from '@/src/providers/LocaleProvider';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
