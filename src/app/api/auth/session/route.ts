import { NextResponse } from 'next/server';
import { getLibrarianSession } from '@/lib/library-data';

export async function GET() {
  const session = await getLibrarianSession();

  if (!session) {
    return NextResponse.json({ session: null }, { status: 401 });
  }

  return NextResponse.json({ session });
}
