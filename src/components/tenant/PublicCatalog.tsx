'use client';

import Link from 'next/link';
import Image from 'next/image';
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
      book.categories.forEach(cat => {
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
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
      setStatusMessage(payload.error || 'No se pudo enviar la solicitud.');
      return;
    }

    setStatusMessage(t('borrowRequest.success.created') || `Solicitud enviada para ${payload.loan.book?.title || 'el libro seleccionado'}`);
    setRequestingBookId(null);
    setRequestForm({
      full_name: '',
      identifier: '',
      requested_copies: 1,
    });
    setQuery('');
  }

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());


  return (
    <main className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(246,188,96,0.22),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#fff_48%,_#f6f8fb_100%)]">
      <header className="relative z-0 flex flex-wrap items-center justify-between gap-4 px-6 pt-6 md:px-10">
        <div className="flex flex-wrap gap-3">
          <Link href={'/libraries'} className="inline-flex shrink-0 rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 shadow-sm">
            &larr; {t('common.changeLibrary') || 'Cambiar sede'}
          </Link>
          <Link href={librarySlug ? `/l/${librarySlug}/my-loans` : '/my-loans'} className="inline-flex shrink-0 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-md">
            {t('dashboard.quickActions.myRequests') || 'Consultar mis préstamos'}
          </Link>
        </div>
        <LanguageSwitcher className="flex items-center shrink-0 z-50" />
      </header>


      <section className="mx-auto max-w-7xl pt-10 px-6 pb-10 md:px-10 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.7fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-amber-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 backdrop-blur">
                {t('common.publicLibraryCatalog') || 'Catálogo de la biblioteca'}
              </span>
              <div className="space-y-3">
                <h1 className="font-serif text-5xl tracking-tight text-slate-900 md:text-6xl">
                  {data?.library?.name || t('common.neighborhoodLibrary') || 'Tu biblioteca local'}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  {t('common.publicDocs') || 'Explora los libros disponibles, solicita un préstamo sin cuenta y mantén todo organizado por sede.'}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t('dashboard.quickActions.browseBooks') || 'Descubrir libros'}</p>
                  <p className="text-sm text-slate-500">{t('common.searchDesc') || 'Busca por título, autor o categoría.'}</p>
                </div>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('search.placeholder') || "Buscar libros disponibles"}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-300 focus:bg-white md:max-w-md"
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading && <div className="text-sm text-slate-500">Cargando libros...</div>}
                {!loading &&
                  data?.books.map((book) => (
                    <article key={book.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-0.5 hover:bg-white flex flex-col justify-between">
                      {/* Hidden probe to detect broken images early */}
                      {book.image_url && !brokenImages.has(book.image_url) && (
                        <img
                          src={book.image_url}
                          alt=""
                          className="hidden"
                          onError={() => setBrokenImages(prev => new Set(prev).add(book.image_url!))}
                        />
                      )}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{book.categories.join(', ')}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <h2 className="text-xl font-semibold text-slate-900 leading-tight">{book.title}</h2>
                              {book.image_url && !brokenImages.has(book.image_url) && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(book.image_url!)}
                                  className="text-slate-400 hover:text-slate-900 transition shrink-0"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{book.author}</p>
                          </div>
                          <span className="whitespace-nowrap flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                            {book.available_copies} {t('books.table.available') || 'disponibles'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{t('books.table.total') || 'Total'}: {book.total_copies}</span>
                          <button
                            type="button"
                            onClick={() => setRequestingBookId(requestingBookId === book.id ? null : book.id)}
                            className="rounded-full bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
                          >
                            {t('borrowRequest.actions.submit') || 'Solicitar'}
                          </button>
                        </div>

                        {requestingBookId === book.id && (
                          <form onSubmit={(event) => submitLoanRequest(event, book.id)} className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                            <input
                              value={requestForm.full_name}
                              onChange={(event) => setRequestForm((current) => ({ ...current, full_name: event.target.value }))}
                              placeholder="Nombre completo"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                            />
                            <input
                              value={requestForm.identifier}
                              onChange={(event) => setRequestForm((current) => ({ ...current, identifier: event.target.value }))}
                              placeholder="Email, ID nacional o carnet"
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
                              {t('borrowRequest.actions.submit') || 'Enviar solicitud'}
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('dashboard.stats.desc.inCatalog') || 'Categorías'}</p>
              <div className="mt-4 space-y-3">
                {groupedCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span className="capitalize">{category}</span>
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

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-white rounded-[2.5rem] p-4 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-6 right-6 z-10 rounded-full bg-white/80 p-2 text-slate-900 shadow-md hover:bg-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-100 relative">
              <Image
                src={previewImage}
                alt="Vista previa"
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  if (previewImage) {
                    setBrokenImages(prev => new Set(prev).add(previewImage));
                  }
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Imagen+No+Disponible';
                }}

              />
            </div>

          </div>
        </div>
      )}
    </main>
  );
}

