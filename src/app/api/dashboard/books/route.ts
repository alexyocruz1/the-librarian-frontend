import { NextRequest, NextResponse } from 'next/server';
import {
  createDashboardBook,
  deleteDashboardBook,
  getLibrarianSession,
  listDashboardBooks,
  updateDashboardBook,
} from '@/lib/library-data';

export async function GET(request: NextRequest) {
  const session = await getLibrarianSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const libraryId = request.nextUrl.searchParams.get('libraryId') || undefined;
  const books = await listDashboardBooks(session, libraryId);
  return NextResponse.json({ books });
}

export async function POST(request: NextRequest) {
  const session = await getLibrarianSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const book = await createDashboardBook(session, {
      library_id: String(body.library_id || ''),
      title: String(body.title || ''),
      author: String(body.author || ''),
      category: String(body.category || ''),
      total_copies: Number(body.total_copies || 0),
      available_copies: Number(body.available_copies || 0),
    });
    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create book.' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getLibrarianSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const book = await updateDashboardBook(session, String(body.id || ''), {
      library_id: String(body.library_id || ''),
      title: String(body.title || ''),
      author: String(body.author || ''),
      category: String(body.category || ''),
      total_copies: Number(body.total_copies || 0),
      available_copies: Number(body.available_copies || 0),
    });
    return NextResponse.json({ book });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update book.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getLibrarianSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    await deleteDashboardBook(session, String(body.id || ''), String(body.library_id || ''));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete book.' },
      { status: 400 }
    );
  }
}
