import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomainFromHost } from '@/lib/tenant';

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const subdomain = extractSubdomainFromHost(request.headers.get('host'));

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
