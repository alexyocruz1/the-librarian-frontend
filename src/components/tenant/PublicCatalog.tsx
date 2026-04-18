'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LibraryTenant, TenantBook } from '@/types/tenant';
import { cn, formatDateTime } from '@/lib/utils';

interface CatalogResponse {
  library: LibraryTenant;
  books: TenantBook[];
}

interface PublicCatalogProps {
  librarySlug?: string;
}

export default function PublicCatalog({ librarySlug }: PublicCatalogProps) {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [requestingBookId, setRequestingBookId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState({
    full_name: '',
    identifier: '',
    requested_copies: 1,
  });

  useEffect(() => {
    const controller = new AbortController();
    const booksEndpoint = librarySlug
      ? `/api/public/books/${encodeURIComponent(librarySlug)}`
      : '/api/public/books';

    async function loadBooks() {
      setLoading(true);
      const response = await fetch(`${booksEndpoint}${query ? `?q=${encodeURIComponent(query)}` : ''}`, {
        signal: controller.signal,
      });
      const payload = await response.json();
      setData(payload);
      setLoading(false);
    }

    loadBooks().catch(() => setLoading(false));

    return () => controller.abort();
  }, [librarySlug, query]);

  const groupedCategories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    data?.books.forEach((book) => {
      categoryMap.set(book.category, (categoryMap.get(book.category) || 0) + 1);
    });
    return Array.from(categoryMap.entries());
  }, [data]);

  async function submitLoanRequest(event: FormEvent<HTMLFormElement>, bookId: string) {
    event.preventDefault();
    setStatusMessage(null);

    const loanEndpoint = librarySlug
      ? `/api/public/loan-requests/${encodeURIComponent(librarySlug)}`
      : '/api/public/loan-requests';

    const response = await fetch(loanEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestForm,
        book_id: bookId,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setStatusMessage(payload.error || 'Unable to submit request.');
      return;
    }

    setStatusMessage(`Request sent for ${payload.loan.book?.title || 'the selected book'} at ${formatDateTime(payload.loan.created_at)}.`);
    setRequestingBookId(null);
    setRequestForm({
      full_name: '',
      identifier: '',
      requested_copies: 1,
    });
    setQuery('');
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(246,188,96,0.22),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#fff_48%,_#f6f8fb_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.7fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-amber-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 backdrop-blur">
                Public library catalog
              </span>
              <div className="space-y-3">
                <h1 className="font-serif text-5xl tracking-tight text-slate-900 md:text-6xl">
                  {data?.library?.name || 'Your neighborhood library'}, organized around fast borrowing.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  Browse only books that are currently available, request a loan without creating an account, and keep every action scoped to the current library.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Discover books</p>
                  <p className="text-sm text-slate-500">Search by title, author, or category.</p>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search available books"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:bg-white md:max-w-md"
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading && <div className="text-sm text-slate-500">Loading books...</div>}
                {!loading &&
                  data?.books.map((book) => (
                    <article key={book.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-0.5 hover:bg-white">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{book.category}</p>
                            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{book.title}</h2>
                            <p className="mt-1 text-sm text-slate-600">{book.author}</p>
                          </div>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {book.available_copies} available
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>Total copies: {book.total_copies}</span>
                          <button
                            type="button"
                            onClick={() => setRequestingBookId(requestingBookId === book.id ? null : book.id)}
                            className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
                          >
                            Request loan
                          </button>
                        </div>

                        {requestingBookId === book.id && (
                          <form onSubmit={(event) => submitLoanRequest(event, book.id)} className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                            <input
                              value={requestForm.full_name}
                              onChange={(event) => setRequestForm((current) => ({ ...current, full_name: event.target.value }))}
                              placeholder="Full name"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                              value={requestForm.identifier}
                              onChange={(event) => setRequestForm((current) => ({ ...current, identifier: event.target.value }))}
                              placeholder="Email, national ID, or student ID"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                              type="number"
                              min={1}
                              max={book.available_copies}
                              value={requestForm.requested_copies}
                              onChange={(event) =>
                                setRequestForm((current) => ({
                                  ...current,
                                  requested_copies: Number(event.target.value || 1),
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <button className="w-full rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                              Submit request
                            </button>
                          </form>
                        )}
                      </div>
                    </article>
                  ))}
              </div>
            </div>
            {statusMessage && <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{statusMessage}</p>}
          </div>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.9)]">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Current tenant</p>
              <h2 className="mt-3 text-3xl font-semibold">
                {librarySlug ? `/l/${librarySlug}` : data?.library?.subdomain || 'library'}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {data?.library?.description || 'Each tenant keeps books, loans, and librarian access fully isolated.'}
              </p>
              <Link href={librarySlug ? `/l/${librarySlug}/my-loans` : '/my-loans'} className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-100">
                Look up my loans
              </Link>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Catalog mix</p>
              <div className="mt-4 space-y-3">
                {groupedCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span>{category}</span>
                    <span className={cn('rounded-full px-3 py-1 font-semibold', count > 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700')}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Demo credentials</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                In local mock mode, sign in as <span className="font-semibold text-slate-900">ana@librarian.test</span> or{' '}
                <span className="font-semibold text-slate-900">marcus@librarian.test</span> with password <span className="font-semibold text-slate-900">library123</span>.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
