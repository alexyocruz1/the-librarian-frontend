import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomainFromHost } from '@/lib/tenant';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  let subdomain = extractSubdomainFromHost(request.headers.get('host'));

  if (!subdomain && request.nextUrl.pathname.startsWith('/l/')) {
    const parts = request.nextUrl.pathname.split('/');
    if (parts.length >= 3) {
      subdomain = parts[2];
    }
  }

  if (subdomain) {
    requestHeaders.set('x-library-subdomain', subdomain);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
