import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import ClientProviders from '@/components/ClientProviders';
import DynamicBackground from '@/components/DynamicBackground';
import './globals.css';

export const metadata: Metadata = {
  title: 'El Bibliotecario',
  description: 'Manage your library with ease.',
  icons: {
    icon: '/watermark.jpeg',
    apple: '/watermark.jpeg',
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
        <DynamicBackground />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
