const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY);
}

function getHeaders(options?: { service?: boolean; accessToken?: string; prefer?: string }) {
  const apiKey = options?.service ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !apiKey) {
    throw new Error('Supabase environment variables are not configured.');
  }

  const headers: HeadersInit = {
    apikey: apiKey,
    Authorization: `Bearer ${options?.accessToken || apiKey}`,
    'Content-Type': 'application/json',
  };

  if (options?.prefer) {
    headers.Prefer = options.prefer;
  }

  return headers;
}

export async function supabaseRest<T>(path: string, init?: RequestInit, options?: { service?: boolean; accessToken?: string; prefer?: string }) {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL is not configured.');
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      ...getHeaders(options),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Supabase request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function supabaseLogin(email: string, password: string) {
  return supabaseRest<{
    access_token: string;
    refresh_token: string;
    user: { id: string; email?: string; user_metadata?: { full_name?: string } };
  }>(`/auth/v1/token?grant_type=password`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function supabaseUser(accessToken: string) {
  return supabaseRest<{ id: string; email?: string; user_metadata?: { full_name?: string } }>(
    '/auth/v1/user',
    {
      method: 'GET',
    },
    { accessToken }
  );
}
