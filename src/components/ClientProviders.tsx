'use client';

import { ReactNode } from 'react';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { I18nProvider } from '@/context/I18nContext';
import { AuthProvider } from '@/context/AuthContext';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <I18nProvider>
          {children}
        </I18nProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
