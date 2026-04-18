'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LibraryTenant, TenantBook } from '@/types/tenant';
import { cn, formatDateTime } from '@/lib/utils';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/context/I18nContext';

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
  const { t } = useI18n();

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

    setStatusMessage(t('borrowRequest.success.created') || `Request sent for ${payload.loan.book?.title || 'the selected book'}`);
    setRequestingBookId(null);
    setRequestForm({
      full_name: '',
      identifier: '',
      requested_copies: 1,
    });
    setQuery('');
  }

  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(246,188,96,0.22),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#fff_48%,_#f6f8fb_100%)]">
      <header className="relative z-40 flex flex-wrap items-start justify-between gap-4 px-6 pt-6 md:px-10">
         <Link href={librarySlug ? `/l/${librarySlug}/my-loans` : '/my-loans'} className="inline-flex shrink-0 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-md">
            {t('dashboard.quickActions.myRequests') || 'Look up my loans'}
          </Link>
          <LanguageSwitcher className="flex items-center shrink-0 z-50" />
      </header>

      <section className="mx-auto max-w-7xl pt-10 px-6 pb-10 md:px-10 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.7fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-amber-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 backdrop-blur">
                {t('common.publicLibraryCatalog') || 'Public library catalog'}
              </span>
              <div className="space-y-3">
                <h1 className="font-serif text-5xl tracking-tight text-slate-900 md:text-6xl">
                  {data?.library?.name || t('common.neighborhoodLibrary') || 'Your neighborhood library'}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  {t('common.publicDocs') || 'Browse only books that are currently available, request a loan without creating an account, and keep every action scoped to the current library.'}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('dashboard.quickActions.browseBooks') || 'Discover books'}</p>
                  <p className="text-sm text-slate-500">{t('common.searchDesc') || 'Search by title, author, or category.'}</p>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('search.placeholder') || "Search available books"}
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
                          <span className="whitespace-nowrap flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {book.available_copies} {t('books.table.available') || 'available'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>{t('books.table.total') || 'Total copies'}: {book.total_copies}</span>
                          <button
                            type="button"
                            onClick={() => setRequestingBookId(requestingBookId === book.id ? null : book.id)}
                            className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
                          >
                            {t('borrowRequest.actions.submit') || 'Request loan'}
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
                              {t('borrowRequest.actions.submit') || 'Submit request'}
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
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('dashboard.stats.desc.inCatalog') || 'Catalog mix'}</p>
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
          </aside>
        </div>
      </section>
    </main>
  );
}
