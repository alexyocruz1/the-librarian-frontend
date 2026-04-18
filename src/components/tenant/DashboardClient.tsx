'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LibraryTenant, TenantBook, TenantLoan } from '@/types/tenant';
import { formatDateTime, groupBy } from '@/lib/utils';

interface DashboardClientProps {
  libraries: LibraryTenant[];
  activeLibraryId?: string;
}

export default function DashboardClient({ libraries, activeLibraryId }: DashboardClientProps) {
  const [loans, setLoans] = useState<TenantLoan[]>([]);
  const [books, setBooks] = useState<TenantBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = activeLibraryId ? `?libraryId=${encodeURIComponent(activeLibraryId)}` : '';

    async function loadData() {
      setLoading(true);
      setError(null);

      const [loanResponse, bookResponse] = await Promise.all([
        fetch(`/api/dashboard/loans${params}`),
        fetch(`/api/dashboard/books${params}`),
      ]);

      const loanPayload = await loanResponse.json();
      const bookPayload = await bookResponse.json();

      if (!loanResponse.ok || !bookResponse.ok) {
        setError(loanPayload.error || bookPayload.error || 'Unable to load dashboard data.');
        setLoading(false);
        return;
      }

      setLoans(loanPayload.loans || []);
      setBooks(bookPayload.books || []);
      setLoading(false);
    }

    loadData().catch(() => {
      setError('Unable to load dashboard data.');
      setLoading(false);
    });
  }, [activeLibraryId]);

  const groupedLoans = useMemo(() => {
    const grouped = groupBy(
      loans.map((loan) => ({ ...loan, group: `${loan.library_id}:${loan.identifier}` })),
      'group'
    );

    return Object.entries(grouped);
  }, [loans]);

  async function updateStatus(loanId: string, status: TenantLoan['status']) {
    const response = await fetch('/api/dashboard/loans', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ loanId, status }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || 'Unable to update loan.');
      return;
    }

    setLoans((current) => current.map((loan) => (loan.id === loanId ? payload.loan : loan)));
    setBooks((current) =>
      current.map((book) =>
        book.id === payload.loan.book_id
          ? {
              ...book,
              available_copies:
                status === 'handled'
                  ? book.available_copies - payload.loan.requested_copies
                  : status === 'returned'
                    ? book.available_copies + payload.loan.requested_copies
                    : book.available_copies,
            }
          : book
      )
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tus Bibliotecas</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{libraries.length}</p>
          <p className="mt-2 text-sm text-slate-600">Solo verás la información de las sedes que te han asignado.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Préstamos activos</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{loans.filter((loan) => loan.status !== 'returned' && loan.status !== 'rejected').length}</p>
          <p className="mt-2 text-sm text-slate-600">Los préstamos pendientes, aprobados y en curso aparecerán aquí.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Inventario en riesgo</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{books.filter((book) => book.available_copies <= 1).length}</p>
          <p className="mt-2 text-sm text-slate-600">Libros con una o ninguna copia disponible.</p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.4fr_0.85fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Fila de préstamos</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Organizado por lector y sede</h2>
            </div>
            <Link href="/dashboard/books" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Ver inventario
            </Link>
          </div>

          {loading && <p className="mt-6 text-sm text-slate-500">Cargando el panel...</p>}
          {error && <p className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <div className="mt-6 space-y-5">
            {groupedLoans.map(([key, items]) => (
              <div key={key} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{items[0].full_name}</h3>
                    <p className="text-sm text-slate-600">{items[0].identifier}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{items[0].library_id}</span>
                </div>

                <div className="mt-4 space-y-3">
                  {items.map((loan) => (
                    <div key={loan.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{loan.book?.title || 'Título desconocido'}</p>
                          <p className="text-sm text-slate-500">
                            {loan.book?.author || 'Autor desconocido'} · {loan.requested_copies} {loan.requested_copies === 1 ? 'copia' : 'copias'} · {formatDateTime(loan.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {loan.status === 'pending' && (
                            <>
                              <button onClick={() => updateStatus(loan.id, 'approved')} className="rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">
                                Aprobar
                              </button>
                              <button onClick={() => updateStatus(loan.id, 'rejected')} className="rounded-full bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700">
                                Rechazar
                              </button>
                            </>
                          )}
                          {loan.status === 'approved' && (
                            <button onClick={() => updateStatus(loan.id, 'handled')} className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
                              Marcar entregado
                            </button>
                          )}
                          {loan.status === 'handled' && (
                            <button onClick={() => updateStatus(loan.id, 'returned')} className="rounded-full bg-sky-100 px-3 py-2 text-xs font-semibold text-sky-700">
                              Marcar devuelto
                            </button>
                          )}
                          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{loan.status === 'pending' ? 'pendiente' : loan.status === 'approved' ? 'aprobado' : loan.status === 'handled' ? 'entregado' : loan.status === 'returned' ? 'devuelto' : loan.status === 'rejected' ? 'rechazado' : loan.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Resumen de Inventario</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Disponibilidad en cada sede</h2>
          <div className="mt-6 space-y-3">
            {books.map((book) => (
              <div key={book.id} className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{book.title}</p>
                    <p className="text-sm text-slate-600">{book.author} · {book.category}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{book.available_copies}/{book.total_copies}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
