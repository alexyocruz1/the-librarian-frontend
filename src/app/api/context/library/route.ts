import { NextResponse } from 'next/server';
import { getRequestSubdomain } from '@/lib/tenant';
import { resolveLibrary } from '@/lib/library-data';

export async function GET() {
  const subdomain = await getRequestSubdomain();
  const library = await resolveLibrary(subdomain);

  if (!library) {
    return NextResponse.json({ error: 'Library not found.' }, { status: 404 });
  }

  return NextResponse.json({ library });
}
