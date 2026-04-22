import { NextRequest, NextResponse } from 'next/server';
import { getLibrarianSession, listDashboardLoans, updateLoanStatus } from '@/lib/library-data';

export async function GET(request: NextRequest) {
  const session = await getLibrarianSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const libraryId = request.nextUrl.searchParams.get('libraryId') || undefined;
  const loans = await listDashboardLoans(session, libraryId);

  return NextResponse.json({ loans });
}

export async function PATCH(request: NextRequest) {
  const session = await getLibrarianSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const loan = await updateLoanStatus(
      session, 
      String(body.loanId || ''), 
      body.status, 
      body.deliveryCondition, 
      body.returnNote,
      body.returnCondition
    );
    return NextResponse.json({ loan });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update loan.' },
      { status: 400 }
    );
  }
}
