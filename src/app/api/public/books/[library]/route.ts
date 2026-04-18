import { NextRequest, NextResponse } from 'next/server';
import { listAvailableBooks, resolveLibrary } from '@/lib/library-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ library: string }> }
) {
  const { library: librarySlug } = await params;
  const library = await resolveLibrary(librarySlug);

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
