import { NextRequest, NextResponse } from 'next/server';
import { lookupLoans, resolveLibrary } from '@/lib/library-data';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ library: string }> }
) {
  const { library: librarySlug } = await params;
  const library = await resolveLibrary(librarySlug);

  if (!library) {
    return NextResponse.json({ error: 'Library not found.' }, { status: 404 });
  }

  const identifier = request.nextUrl.searchParams.get('identifier') || '';
  const loans = await lookupLoans(library.id, identifier);

  return NextResponse.json({ library, loans });
}
