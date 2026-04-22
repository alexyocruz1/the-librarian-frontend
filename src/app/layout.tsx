import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import ClientProviders from '@/components/ClientProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Librarian',
  description: 'Manage your library with ease.',
  icons: {
    icon: '/watermark.jpg',
    apple: '/watermark.jpg',
  },
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
