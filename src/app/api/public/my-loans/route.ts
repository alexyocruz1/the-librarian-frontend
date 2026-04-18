import { NextRequest, NextResponse } from 'next/server';
import { lookupLoans, resolveLibrary } from '@/lib/library-data';
import { getRequestSubdomain } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  const subdomain = await getRequestSubdomain();
  const library = await resolveLibrary(subdomain);

  if (!library) {
    return NextResponse.json({ error: 'Library not found.' }, { status: 404 });
  }

  const identifier = request.nextUrl.searchParams.get('identifier') || '';
  const loans = await lookupLoans(library.id, identifier);

  return NextResponse.json({ library, loans });
}
