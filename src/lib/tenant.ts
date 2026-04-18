import { headers } from 'next/headers';
import { LibraryTenant } from '@/types/tenant';
import { mockLibraries } from '@/lib/mock-tenant-data';

const ROOT_HOSTS = new Set(['localhost', '127.0.0.1']);

export function extractSubdomainFromHost(host: string | null): string | null {
  if (!host) {
    return null;
  }

  const hostname = host.split(':')[0].toLowerCase();
  const parts = hostname.split('.').filter(Boolean);

  if (ROOT_HOSTS.has(hostname)) {
    return null;
  }

  if (hostname.endsWith('.localhost') && parts.length > 1) {
    return parts[0];
  }

  if (parts.length <= 2) {
    return null;
  }

  return parts[0];
}

export async function getRequestSubdomain(): Promise<string | null> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-library-subdomain');
  if (forwarded) {
    return forwarded;
  }

  return extractSubdomainFromHost(headerStore.get('host'));
}

export function getFallbackLibrary(): LibraryTenant {
  return mockLibraries[0];
}

export function isRootHost(host: string | null): boolean {
  if (!host) {
    return true;
  }

  const hostname = host.split(':')[0].toLowerCase();
  return ROOT_HOSTS.has(hostname);
}
