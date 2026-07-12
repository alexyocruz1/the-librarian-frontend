import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { getLibrarianSession, listAccessibleLibraries } from '@/lib/library-data';
import DynamicBackgroundClient from './DynamicBackgroundClient';

export default async function DynamicBackground() {
  const headersList = await headers();
  const headerSubdomain = headersList.get('x-library-subdomain');
  let sessionSubdomain = null;
  
  if (!headerSubdomain) {
    try {
      const session = await getLibrarianSession();
      if (session && session.library_ids.length > 0) {
        const libraries = await listAccessibleLibraries(session);
        if (libraries.length > 0) {
          sessionSubdomain = libraries[0].subdomain;
        }
      }
    } catch (e) {
      // ignore session errors
    }
  }
  
  const publicDir = path.join(process.cwd(), 'public');
  let images: string[] = [];
  try {
    const files = fs.readdirSync(publicDir);
    images = files.filter(file => /\.(jpe?g|png|webp|gif|svg)$/i.test(file));
  } catch (e) {
    images = ['watermark.jpeg'];
  }

  // Ensure watermark exists in our fallback
  if (images.length === 0) {
    images = ['watermark.jpeg'];
  }

  return (
    <DynamicBackgroundClient 
      images={images} 
      sessionSubdomain={sessionSubdomain} 
      initialHeaderSubdomain={headerSubdomain} 
    />
  );
}
