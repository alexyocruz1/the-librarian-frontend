import { cookies } from 'next/headers';
import { BookMutationPayload, LoanRequestPayload, LibrarianSession, LibraryTenant, TenantBook, TenantLoan } from '@/types/tenant';
import { isSupabaseConfigured, supabaseLogin, supabaseRest, supabaseUser } from '@/lib/supabase-rest';
import { mockBooks, mockLibrarians, mockLibraries, mockLoans } from '@/lib/mock-tenant-data';

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

const localRateLedger = new Map<string, number[]>();

function nowIso() {
  return new Date().toISOString();
}

function ensureLibraryAccess(session: LibrarianSession, libraryId: string) {
  if (!session.library_ids.includes(libraryId)) {
    throw new Error('You do not have access to that library.');
  }
}

function validateBookPayload(payload: BookMutationPayload) {
  if (!payload.library_id || !payload.title.trim() || !payload.author.trim() || !payload.categories.length) {
    throw new Error('La biblioteca, el título, el autor y al menos una categoría son obligatorios.');
  }

  if (payload.total_copies < 0) {
    throw new Error('El total de copias no puede ser negativo.');
  }

  if (payload.available_copies < 0) {
    throw new Error('Las copias disponibles no pueden ser negativas.');
  }

  if (payload.available_copies > payload.total_copies) {
    throw new Error('Las copias disponibles no pueden exceder el total de copias.');
  }
}


function withBook(loan: TenantLoan): TenantLoan {
  const book = mockBooks.find((item) => item.id === loan.book_id);
  return {
    ...loan,
    book: book
      ? {
          id: book.id,
          title: book.title,
          author: book.author,
        categories: book.categories,

        }
      : undefined,
  };
}

export async function resolveLibrary(subdomain: string | null): Promise<LibraryTenant | null> {
  if (!subdomain) {
    return null;
  }

  if (!isSupabaseConfigured()) {
    return mockLibraries.find((library) => library.subdomain === subdomain) || null;
  }

  const result = await supabaseRest<LibraryTenant[]>(
    `/rest/v1/libraries?select=id,name,subdomain,city,accent,description&subdomain=eq.${encodeURIComponent(subdomain)}&limit=1`
  );

  return result[0] || null;
}

export async function listPublicLibraries(): Promise<LibraryTenant[]> {
  if (!isSupabaseConfigured()) {
    return mockLibraries;
  }

  return supabaseRest<LibraryTenant[]>(
    `/rest/v1/libraries?select=id,name,subdomain,city,accent,description&order=name.asc`,
    { method: 'GET' },
    { service: true }
  );
}

export async function listAvailableBooks(libraryId: string, query?: string): Promise<TenantBook[]> {
  if (!isSupabaseConfigured()) {
    return mockBooks
      .filter((book) => book.library_id === libraryId && book.available_copies > 0 && !book.archived_at)
      .filter((book) => {
        if (!query) {
          return true;
        }

        const needle = query.toLowerCase();
        return [book.title, book.author, ...book.categories].some((value) => value.toLowerCase().includes(needle));

      });
  }

  const filters = [
    'select=id,library_id,title,author,categories,total_copies,available_copies,library_codes,book_code,editorial,edition,cover_type,shelf_location,cost,acquired_at,image_url,archived_at',
    `library_id=eq.${libraryId}`,
    'available_copies=gt.0',
    'archived_at=is.null',
  ];


  if (query) {
    const escaped = encodeURIComponent(`*${query}*`);
    filters.push(`or=(title.ilike.*${escaped}*,author.ilike.*${escaped}*)`);

  }

  return supabaseRest<TenantBook[]>(`/rest/v1/books?${filters.join('&')}`);
}

export async function lookupLoans(libraryId: string, identifier: string): Promise<TenantLoan[]> {
  if (!identifier.trim()) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    return mockLoans
      .filter((loan) => loan.library_id === libraryId && loan.identifier.toLowerCase() === identifier.toLowerCase())
      .map(withBook);
  }

  const loans = await supabaseRest<TenantLoan[]>(
    `/rest/v1/loans?select=id,library_id,book_id,full_name,identifier,requested_copies,status,created_at,updated_at,handled_at,returned_at&library_id=eq.${libraryId}&identifier=eq.${encodeURIComponent(identifier)}&order=created_at.desc`
  ,
    { method: 'GET' },
    { service: true }
  );

  const books = await supabaseRest<TenantBook[]>(
    `/rest/v1/books?select=id,title,author,categories&library_id=eq.${libraryId}`,

    { method: 'GET' },
    { service: true }
  );
  const bookMap = new Map(books.map((book) => [book.id, book]));

  return loans.map((loan) => ({
    ...loan,
    book: bookMap.get(loan.book_id),
  }));
}

function enforceLocalRateLimit(ip: string) {
  const timestamps = localRateLedger.get(ip) || [];
  const recent = timestamps.filter((timestamp) => Date.now() - timestamp < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    throw new Error('Too many loan requests from this IP. Please try again in a minute.');
  }

  recent.push(Date.now());
  localRateLedger.set(ip, recent);
}

export async function createLoanRequest(libraryId: string, payload: LoanRequestPayload, ip: string) {
  if (!payload.full_name.trim() || !payload.identifier.trim() || !payload.book_id.trim()) {
    throw new Error('All required fields must be completed.');
  }

  if (payload.requested_copies < 1) {
    throw new Error('Requested copies must be at least 1.');
  }

  if (!isSupabaseConfigured()) {
    enforceLocalRateLimit(ip);

    const book = mockBooks.find((item) => item.id === payload.book_id && item.library_id === libraryId);

    if (!book) {
      throw new Error('Book not found for this library.');
    }

    if (payload.requested_copies > book.available_copies) {
      throw new Error('Requested copies exceed the available inventory.');
    }

    const duplicate = mockLoans.find(
      (loan) =>
        loan.library_id === libraryId &&
        loan.book_id === payload.book_id &&
        loan.identifier.toLowerCase() === payload.identifier.toLowerCase() &&
        Date.now() - new Date(loan.created_at).getTime() < DUPLICATE_WINDOW_MS
    );

    if (duplicate) {
      throw new Error('A recent request for this book already exists with that identifier.');
    }

    const loan: TenantLoan = {
      id: `loan-${mockLoans.length + 1}`,
      library_id: libraryId,
      book_id: payload.book_id,
      full_name: payload.full_name.trim(),
      identifier: payload.identifier.trim(),
      requested_copies: payload.requested_copies,
      status: 'pending',
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    mockLoans.unshift(loan);
    return withBook(loan);
  }

  const result = await supabaseRest<TenantLoan[]>(
    '/rest/v1/rpc/create_public_loan_request',
    {
      method: 'POST',
      body: JSON.stringify({
        p_library_id: libraryId,
        p_book_id: payload.book_id,
        p_full_name: payload.full_name.trim(),
        p_identifier: payload.identifier.trim(),
        p_requested_copies: payload.requested_copies,
        p_request_ip: ip,
      }),
    },
    { service: true }
  );

  return result[0];
}

export async function loginLibrarian(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    const user = mockLibrarians.find((item) => item.email.toLowerCase() === email.toLowerCase());

    if (!user || password !== 'library123') {
      throw new Error('Invalid librarian credentials.');
    }

    return {
      accessToken: `mock-token:${user.id}`,
      refreshToken: 'mock-refresh-token',
      session: user,
    };
  }

  const auth = await supabaseLogin(email, password);
  const accessToken = auth.access_token;
  const user = await supabaseUser(accessToken);
  const memberships = await supabaseRest<{ library_id: string }[]>(
    `/rest/v1/librarian_libraries?select=library_id&librarian_id=eq.${user.id}`,
    { method: 'GET' },
    { service: true }
  );

  return {
    accessToken: auth.access_token,
    refreshToken: auth.refresh_token,
    session: {
      id: user.id,
      email: user.email || email,
      full_name: user.user_metadata?.full_name || email,
      library_ids: memberships.map((membership) => membership.library_id),
    } satisfies LibrarianSession,
  };
}

export async function getLibrarianSession(): Promise<LibrarianSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('library-access-token')?.value;

  if (!accessToken) {
    return null;
  }

  if (accessToken.startsWith('mock-token:')) {
    const userId = accessToken.replace('mock-token:', '');
    return mockLibrarians.find((librarian) => librarian.id === userId) || null;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const user = await supabaseUser(accessToken);
    const memberships = await supabaseRest<{ library_id: string }[]>(
      `/rest/v1/librarian_libraries?select=library_id&librarian_id=eq.${user.id}`,
      { method: 'GET' },
      { service: true }
    );

    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email || 'Librarian',
      library_ids: memberships.map((membership) => membership.library_id),
    };
  } catch {
    return null;
  }
}

export async function listAccessibleLibraries(session: LibrarianSession): Promise<LibraryTenant[]> {
  if (!isSupabaseConfigured()) {
    return mockLibraries.filter((library) => session.library_ids.includes(library.id));
  }

  if (!session.library_ids.length) {
    return [];
  }

  const idClause = session.library_ids.join(',');
  return supabaseRest<LibraryTenant[]>(
    `/rest/v1/libraries?select=id,name,subdomain,city,accent,description&id=in.(${idClause})`
  );
}

export async function listDashboardLoans(session: LibrarianSession, activeLibraryId?: string) {
  const libraryIds = activeLibraryId ? [activeLibraryId] : session.library_ids;

  if (!libraryIds.length) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    return mockLoans
      .filter((loan) => libraryIds.includes(loan.library_id))
      .map(withBook)
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }

  const idClause = libraryIds.join(',');
  const loans = await supabaseRest<TenantLoan[]>(
    `/rest/v1/loans?select=id,library_id,book_id,full_name,identifier,requested_copies,status,created_at,updated_at,handled_at,returned_at&library_id=in.(${idClause})&order=created_at.desc`,
    { method: 'GET' },
    { service: true }
  );
  const books = await supabaseRest<TenantBook[]>(
    `/rest/v1/books?select=id,title,author,categories&library_id=in.(${idClause})`,

    { method: 'GET' },
    { service: true }
  );
  const bookMap = new Map(books.map((book) => [book.id, book]));

  return loans.map((loan) => ({
    ...loan,
    book: bookMap.get(loan.book_id),
  }));
}

export async function listDashboardBooks(session: LibrarianSession, activeLibraryId?: string) {
  const libraryIds = activeLibraryId ? [activeLibraryId] : session.library_ids;

  if (!libraryIds.length) {
    return [];
  }

  if (!isSupabaseConfigured()) {
    return mockBooks.filter((book) => libraryIds.includes(book.library_id) && !book.archived_at);
  }

  const idClause = libraryIds.join(',');
  return supabaseRest<TenantBook[]>(
    `/rest/v1/books?select=id,library_id,title,author,categories,total_copies,available_copies,library_codes,book_code,editorial,edition,cover_type,shelf_location,cost,acquired_at,image_url,archived_at&library_id=in.(${idClause})&archived_at=is.null&order=title.asc`,
    { method: 'GET' },
    { service: true }
  );

}

export async function createDashboardBook(session: LibrarianSession, payload: BookMutationPayload) {
  validateBookPayload(payload);
  ensureLibraryAccess(session, payload.library_id);

  const normalizedCategories = payload.categories.map(c => c.trim().toLowerCase());

  // Generation logic for library_codes (needs to work for both Mock and Supabase)
  const library_codes: string[] = [];

  
  // 1. Get the library subdomain
  let subdomain = 'lib';
  if (!isSupabaseConfigured()) {
    const library = mockLibraries.find(l => l.id === payload.library_id);
    subdomain = (library?.subdomain || 'lib').toLowerCase();
  } else {
    const libs = await listAccessibleLibraries(session);
    const lib = libs.find(l => l.id === payload.library_id);
    subdomain = (lib?.subdomain || 'lib').toLowerCase();
  }

  // 2. Find max sequence
  let maxSeq = 0;
  if (!isSupabaseConfigured()) {
    const libBooks = mockBooks.filter(b => b.library_id === payload.library_id);
    libBooks.forEach(b => {
      b.library_codes.forEach(code => {
        const num = parseInt(code.replace(subdomain, ''));
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      });
    });
  } else {
    // In a real app we'd query Supabase for the max code, 
    // but for the sake of this implementation we'll fetch existing and find max locally
    const existing = await listDashboardBooks(session, payload.library_id);
    existing.forEach(b => {

      b.library_codes?.forEach(code => {
        const num = parseInt(code.replace(subdomain, ''));
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      });
    });
  }

  // 3. Generate new codes
  for (let i = 1; i <= payload.total_copies; i++) {
    library_codes.push(`${subdomain}${String(maxSeq + i).padStart(4, '0')}`);
  }

  if (!isSupabaseConfigured()) {
    const book: TenantBook = {
      id: `book-${mockBooks.length + 1}`,
      library_id: payload.library_id,
      title: payload.title.trim(),
      author: payload.author.trim(),
      categories: normalizedCategories,
      total_copies: payload.total_copies,
      available_copies: payload.available_copies,
      library_codes,
      book_code: payload.book_code,
      editorial: payload.editorial,
      edition: payload.edition,
      cover_type: payload.cover_type,
      shelf_location: payload.shelf_location,
      cost: payload.cost,
      acquired_at: payload.acquired_at,
      image_url: payload.image_url,
      archived_at: null,
    };

    mockBooks.push(book);
    return book;
  }

  const result = await supabaseRest<TenantBook[]>(
    '/rest/v1/books?select=*',
    {
      method: 'POST',
      body: JSON.stringify([
        {
          library_id: payload.library_id,
          title: payload.title.trim(),
          author: payload.author.trim(),
          categories: normalizedCategories,
          total_copies: payload.total_copies,
          available_copies: payload.available_copies,
          library_codes,
          book_code: payload.book_code,
          editorial: payload.editorial,
          edition: payload.edition,
          cover_type: payload.cover_type,
          shelf_location: payload.shelf_location,
          cost: payload.cost,
          acquired_at: payload.acquired_at,
          image_url: payload.image_url,
        },
      ]),
    },
    { service: true, prefer: 'return=representation' }
  );

  return result[0];
}

export async function updateDashboardBook(session: LibrarianSession, bookId: string, payload: BookMutationPayload) {
  validateBookPayload(payload);
  ensureLibraryAccess(session, payload.library_id);

  const normalizedCategories = payload.categories.map(c => c.trim().toLowerCase());

  if (!isSupabaseConfigured()) {
    const book = mockBooks.find((item) => item.id === bookId && !item.archived_at);

    if (!book) {
      throw new Error('Libro no encontrado.');
    }

    ensureLibraryAccess(session, book.library_id);

    // If total_copies increased, we should generate more library_codes
    if (payload.total_copies > book.total_copies) {
      const library = mockLibraries.find(l => l.id === payload.library_id);
      const subdomain = (library?.subdomain || 'lib').toLowerCase();
      const libBooks = mockBooks.filter(b => b.library_id === payload.library_id);
      let maxSeq = 0;
      libBooks.forEach(b => {
        b.library_codes.forEach(code => {
          const num = parseInt(code.replace(subdomain, ''));
          if (!isNaN(num) && num > maxSeq) maxSeq = num;
        });
      });

      const jump = payload.total_copies - book.total_copies;
      for (let i = 1; i <= jump; i++) {
        book.library_codes.push(`${subdomain}${String(maxSeq + i).padStart(4, '0')}`);
      }
    }

    book.title = payload.title.trim();
    book.author = payload.author.trim();
    book.categories = normalizedCategories;
    book.total_copies = payload.total_copies;
    book.available_copies = payload.available_copies;
    book.book_code = payload.book_code;
    book.editorial = payload.editorial;
    book.edition = payload.edition;
    book.cover_type = payload.cover_type;
    book.shelf_location = payload.shelf_location;
    book.cost = payload.cost;
    book.acquired_at = payload.acquired_at;
    book.image_url = payload.image_url;

    return book;
  }

  // Handle library_codes expansion for Supabase
  const currentBook = await supabaseRest<TenantBook[]>(`/rest/v1/books?id=eq.${bookId}&select=*`, { method: 'GET' }, { service: true });
  const book = currentBook[0];
  const library_codes = book.library_codes || [];


  if (payload.total_copies > book.total_copies) {
    const libs = await listAccessibleLibraries(session);
    const lib = libs.find(l => l.id === payload.library_id);
    const subdomain = (lib?.subdomain || 'lib').toLowerCase();
    
    const existing = await listDashboardBooks(session, payload.library_id);
    let maxSeq = 0;
    existing.forEach(b => {

      b.library_codes?.forEach(code => {
        const num = parseInt(code.replace(subdomain, ''));
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      });
    });

    const jump = payload.total_copies - book.total_copies;
    for (let i = 1; i <= jump; i++) {
      library_codes.push(`${subdomain}${String(maxSeq + i).padStart(4, '0')}`);
    }
  }

  const result = await supabaseRest<TenantBook[]>(
    `/rest/v1/books?id=eq.${bookId}&library_id=eq.${payload.library_id}&archived_at=is.null&select=*`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        title: payload.title.trim(),
        author: payload.author.trim(),
        categories: normalizedCategories,
        total_copies: payload.total_copies,
        available_copies: payload.available_copies,
        library_codes,
        book_code: payload.book_code,
        editorial: payload.editorial,
        edition: payload.edition,
        cover_type: payload.cover_type,
        shelf_location: payload.shelf_location,
        cost: payload.cost,
        acquired_at: payload.acquired_at,
        image_url: payload.image_url,
      }),
    },
    { service: true, prefer: 'return=representation' }
  );

  if (!result[0]) {
    throw new Error('Libro no encontrado.');
  }

  return result[0];
}



export async function deleteDashboardBook(session: LibrarianSession, bookId: string, libraryId: string) {
  ensureLibraryAccess(session, libraryId);

  if (!isSupabaseConfigured()) {
    const book = mockBooks.find((item) => item.id === bookId && item.library_id === libraryId && !item.archived_at);

    if (!book) {
      throw new Error('Book not found.');
    }

    const activeLoans = mockLoans.some(
      (loan) =>
        loan.book_id === bookId &&
        loan.library_id === libraryId &&
        loan.status !== 'returned' &&
        loan.status !== 'rejected'
    );

    if (activeLoans) {
      throw new Error('Books with active loans cannot be deleted.');
    }

    book.archived_at = nowIso();
    return { success: true };
  }

  const activeLoans = await supabaseRest<{ id: string }[]>(
    `/rest/v1/loans?select=id&book_id=eq.${bookId}&library_id=eq.${libraryId}&status=in.(pending,approved,handled)`,
    { method: 'GET' },
    { service: true }
  );

  if (activeLoans.length) {
    throw new Error('Books with active loans cannot be deleted.');
  }

  await supabaseRest<TenantBook[]>(
    `/rest/v1/books?id=eq.${bookId}&library_id=eq.${libraryId}&archived_at=is.null&select=id`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        archived_at: nowIso(),
      }),
    },
    { service: true, prefer: 'return=representation' }
  );

  return { success: true };
}

export async function updateLoanStatus(session: LibrarianSession, loanId: string, nextStatus: TenantLoan['status']) {
  if (!isSupabaseConfigured()) {
    const loan = mockLoans.find((item) => item.id === loanId);

    if (!loan) {
      throw new Error('Loan not found.');
    }

    if (!session.library_ids.includes(loan.library_id)) {
      throw new Error('You do not have access to that library.');
    }

    const book = mockBooks.find((item) => item.id === loan.book_id);

    if (!book) {
      throw new Error('Book not found.');
    }

    if (nextStatus === 'handled') {
      if (loan.status !== 'approved') {
        throw new Error('Only approved loans can be marked as handled.');
      }

      if (book.available_copies < loan.requested_copies) {
        throw new Error('Not enough available copies to handle this loan.');
      }

      book.available_copies -= loan.requested_copies;
      loan.handled_at = nowIso();
    }

    if (nextStatus === 'returned') {
      if (loan.status !== 'handled') {
        throw new Error('Only handled loans can be marked as returned.');
      }

      book.available_copies += loan.requested_copies;
      loan.returned_at = nowIso();
    }

    if (nextStatus === 'approved' || nextStatus === 'rejected') {
      if (loan.status !== 'pending') {
        throw new Error('Only pending loans can be approved or rejected.');
      }
    }

    loan.status = nextStatus;
    loan.updated_at = nowIso();

    return withBook(loan);
  }

  const result = await supabaseRest<TenantLoan[]>(
    '/rest/v1/rpc/transition_loan_status',
    {
      method: 'POST',
      body: JSON.stringify({
        p_loan_id: loanId,
        p_next_status: nextStatus,
        p_librarian_id: session.id,
      }),
    },
    { service: true }
  );

  const loan = result[0];
  const books = await supabaseRest<TenantBook[]>(
    `/rest/v1/books?select=id,title,author,categories&library_id=eq.${loan.library_id}&id=eq.${loan.book_id}`,

    { method: 'GET' },
    { service: true }
  );

  return {
    ...loan,
    book: books[0],
  };
}
