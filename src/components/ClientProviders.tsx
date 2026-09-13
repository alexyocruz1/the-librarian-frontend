'use client';

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { PreferencesProvider } from '@/context/PreferencesContext';
import { I18nProvider } from '@/context/I18nContext';
import { AuthProvider } from '@/context/AuthContext';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <I18nProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'rounded-2xl shadow-medium border border-gray-200 dark:border-gray-700',
              style: {
                background: 'var(--color-background)',
                color: 'var(--color-foreground)',
              },
              success: {
                iconTheme: { primary: 'var(--color-success-600)', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: 'var(--color-error-600)', secondary: 'white' },
              },
            }}
          />
        </I18nProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
