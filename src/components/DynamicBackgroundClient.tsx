'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DynamicBackgroundClient({ 
  images, 
  sessionSubdomain, 
  initialHeaderSubdomain 
}: { 
  images: string[], 
  sessionSubdomain: string | null,
  initialHeaderSubdomain: string | null
}) {
  const pathname = usePathname();
  const [activeSubdomain, setActiveSubdomain] = useState<string | null>(initialHeaderSubdomain || sessionSubdomain);

  useEffect(() => {
    let current = initialHeaderSubdomain || sessionSubdomain;

    // Check if we are in a public catalog
    if (pathname && pathname.startsWith('/l/')) {
      const parts = pathname.split('/');
      if (parts.length >= 3 && parts[2]) {
        current = parts[2];
      }
    }

    // Check host for subdomain if still null
    if (!current && typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host.includes('.') && !host.startsWith('127.0.0.1') && host !== 'localhost') {
        const parts = host.split('.');
        if (parts.length > 1 && host.endsWith('localhost')) {
          current = parts[0];
        } else if (parts.length > 2) {
          current = parts[0];
        }
      }
    }

    setActiveSubdomain(current);
  }, [pathname, initialHeaderSubdomain, sessionSubdomain]);

  let bgImage = null;

  if (activeSubdomain) {
    const match = images.find(img => img.toLowerCase().startsWith(activeSubdomain!.toLowerCase() + '.'));
    bgImage = match ? `/${match}` : '/watermark.jpeg';
    
    return (
      <div 
        className="fixed inset-0 z-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url('${bgImage}')`,
          backgroundRepeat: 'repeat',
          backgroundSize: '220px'
        }}
      />
    );
  }

  // Collage mode
  return (
    <div className="fixed inset-0 z-0 opacity-[0.07] pointer-events-none flex flex-wrap overflow-hidden justify-center content-start">
      {Array.from({ length: 200 }).map((_, i) => (
        <div 
          key={i} 
          className="w-[220px] h-[220px] flex-shrink-0"
          style={{ 
            backgroundImage: `url('/${images[i % images.length]}')`, 
            backgroundSize: 'contain', 
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }} 
        />
      ))}
    </div>
  );
}
