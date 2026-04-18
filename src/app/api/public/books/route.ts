import { NextRequest, NextResponse } from 'next/server';
import { listAvailableBooks, resolveLibrary } from '@/lib/library-data';
import { getRequestSubdomain } from '@/lib/tenant';

export async function GET(request: NextRequest) {
  const subdomain = await getRequestSubdomain();
  const library = await resolveLibrary(subdomain);

  if (!library) {
    return NextResponse.json({ error: 'Library not found.' }, { status: 404 });
  }

  const query = request.nextUrl.searchParams.get('q') || undefined;
  const books = await listAvailableBooks(library.id, query);

  return NextResponse.json({
    library,
    books,
  });
}
