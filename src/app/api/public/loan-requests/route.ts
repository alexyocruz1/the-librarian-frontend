import { NextRequest, NextResponse } from 'next/server';
import { createLoanRequest, resolveLibrary } from '@/lib/library-data';
import { getClientIp } from '@/lib/request';
import { getRequestSubdomain } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const subdomain = await getRequestSubdomain();
    const library = await resolveLibrary(subdomain);

    if (!library) {
      return NextResponse.json({ error: 'Library not found.' }, { status: 404 });
    }

    const body = await request.json();
    const loan = await createLoanRequest(
      library.id,
      {
        full_name: String(body.full_name || ''),
        identifier: String(body.identifier || ''),
        book_id: String(body.book_id || ''),
        requested_copies: Number(body.requested_copies || 1),
        due_date: String(body.due_date || ''),
      },
      getClientIp(request)
    );

    return NextResponse.json({ loan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to submit the loan request.' },
      { status: 400 }
    );
  }
}
