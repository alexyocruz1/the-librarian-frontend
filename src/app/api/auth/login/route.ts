import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { loginLibrarian } from '@/lib/library-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await loginLibrarian(String(body.email || ''), String(body.password || ''));
    const cookieStore = await cookies();

    cookieStore.set('library-access-token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    cookieStore.set('library-refresh-token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ session: result.session });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to sign in.' },
      { status: 401 }
    );
  }
}
