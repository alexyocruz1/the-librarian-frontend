'use client';

import { ReactNode } from 'react';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { I18nProvider } from '@/context/I18nContext';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <PreferencesProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </PreferencesProvider>
  );
}
