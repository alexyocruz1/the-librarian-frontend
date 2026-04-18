import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import ClientProviders from '@/components/ClientProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Librarian',
  description: 'Multi-tenant library management for public browsing and librarian-led loan handling.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
