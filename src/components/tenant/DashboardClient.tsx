'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LibraryTenant, TenantBook, TenantLoan } from '@/types/tenant';
import { cn, formatDateTime, groupBy } from '@/lib/utils';

interface DashboardClientProps {
  libraries: LibraryTenant[];
  activeLibraryId?: string;
}

export default function DashboardClient({ libraries, activeLibraryId }: DashboardClientProps) {
  const [loans, setLoans] = useState<TenantLoan[]>([]);
  const [books, setBooks] = useState<TenantBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredAndGroupedLoans = useMemo(() => {
    const filtered = loans.filter((loan) => {
      const matchesSearch =
        !searchQuery ||
        loan.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.identifier?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'pending') return loan.status === 'pending';
      if (activeTab === 'active') return loan.status === 'approved' || loan.status === 'handled';
      if (activeTab === 'history') return loan.status === 'returned' || loan.status === 'rejected';

      return true;
    });

    const grouped = groupBy(
      filtered.map((loan) => ({ ...loan, group: `${loan.library_id}:${loan.identifier}` })),
      'group'
    );

    return Object.entries(grouped);
  }, [loans, activeTab, searchQuery]);

  const lowStockBooks = useMemo(() => {
    return books.filter((book) => book.available_copies <= 2).slice(0, 10);
  }, [books]);

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
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tus Bibliotecas</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{libraries.length}</p>
          <p className="mt-2 text-sm text-slate-600">Sedes bajo tu administración.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-l-amber-400 border-l-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pendientes</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{loans.filter((l) => l.status === 'pending').length}</p>
          <p className="mt-2 text-sm text-slate-600">Solicitudes nuevas esperando aprobación.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm border-l-emerald-400 border-l-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">En curso</p>
          <p className="mt-3 text-4xl font-semibold text-slate-900">{loans.filter((l) => l.status === 'approved' || l.status === 'handled').length}</p>
          <p className="mt-2 text-sm text-slate-600">Libros ya aprobados o prestados actualmente.</p>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.5fr_0.75fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Gestión de préstamos</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Seguimiento por lector</h2>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('pending')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-xl transition',
                  activeTab === 'pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Pendientes
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-xl transition',
                  activeTab === 'active' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Activos
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-xl transition',
                  activeTab === 'history' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Historial
              </button>
            </div>
          </div>

          <div className="mt-6">
            <input
              type="text"
              placeholder="Buscar por nombre o identificador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
            />
          </div>

          {loading && <p className="mt-8 text-center text-sm text-slate-500">Actualizando cola de préstamos...</p>}
          {error && <p className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <div className="mt-8 space-y-6">
            {filteredAndGroupedLoans.map(([key, items]) => (
              <div key={key} className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{items[0].full_name}</h3>
                    <p className="text-sm font-medium text-slate-500">{items[0].identifier}</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Sede: {libraries.find((l) => l.id === items[0].library_id)?.name || items[0].library_id}
                  </span>
                </div>

                <div className="space-y-4">
                  {items.map((loan) => (
                    <div key={loan.id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate text-lg">{loan.book?.title || 'Título desconocido'}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 font-medium">
                            <span>{loan.book?.author || 'Autor desconocido'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{loan.requested_copies} {loan.requested_copies === 1 ? 'copia' : 'copias'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{formatDateTime(loan.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col lg:items-end gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                          <div className="flex flex-col items-start lg:items-end gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-tight text-slate-400">Estado</span>
                            <span className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                              loan.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              loan.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              loan.status === 'handled' ? 'bg-sky-100 text-sky-700' :
                              loan.status === 'returned' ? 'bg-slate-100 text-slate-500' :
                              'bg-rose-100 text-rose-700'
                            )}>
                              {loan.status === 'pending' ? 'espera' : 
                               loan.status === 'approved' ? 'aprobado' : 
                               loan.status === 'handled' ? 'entregado' : 
                               loan.status === 'returned' ? 'devuelto' : 
                               loan.status === 'rejected' ? 'rechazado' : loan.status}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            {loan.status === 'pending' && (
                              <>
                                <button onClick={() => updateStatus(loan.id, 'approved')} className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition">
                                  Aprobar
                                </button>
                                <button onClick={() => updateStatus(loan.id, 'rejected')} className="h-10 rounded-xl bg-white border border-rose-200 px-4 text-xs font-bold text-rose-600 hover:bg-rose-50 transition">
                                  Rechazar
                                </button>
                              </>
                            )}
                            {loan.status === 'approved' && (
                              <button onClick={() => updateStatus(loan.id, 'handled')} className="h-10 rounded-xl bg-amber-500 px-4 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition">
                                Marcar entrega
                              </button>
                            )}
                            {loan.status === 'handled' && (
                              <button onClick={() => updateStatus(loan.id, 'returned')} className="h-10 rounded-xl bg-sky-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-sky-700 transition">
                                Recibir devolución
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!loading && filteredAndGroupedLoans.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-slate-400 font-medium">No se encontraron préstamos en esta categoría.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Stock Crítico</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Libros por agotarse</h2>
            <p className="mt-1 text-sm text-slate-500">Mostrando hasta 10 títulos con existencias bajas.</p>
            
            <div className="mt-6 space-y-3">
              {lowStockBooks.map((book) => (
                <div key={book.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{book.title}</p>
                      <p className="text-xs text-slate-500 font-medium">{book.author} · {book.category}</p>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-1 text-xs font-bold",
                      book.available_copies === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {book.available_copies}/{book.total_copies}
                    </span>
                  </div>
                </div>
              ))}
              
              {books.length > 0 && lowStockBooks.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400 font-medium italic">Todo el inventario tiene buen stock.</p>
              )}
            </div>

            <Link href="/dashboard/books" className="mt-6 block w-full rounded-2xl border border-slate-200 py-3 text-center text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
              Gestionar inventario completo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
