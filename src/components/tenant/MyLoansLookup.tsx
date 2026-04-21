'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { TenantLoan } from '@/types/tenant';
import { cn, formatDateTime } from '@/lib/utils';


interface MyLoansLookupProps {
  librarySlug?: string;
}

export default function MyLoansLookup({ librarySlug }: MyLoansLookupProps) {
  const [identifier, setIdentifier] = useState('');
  const [loans, setLoans] = useState<TenantLoan[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const endpoint = librarySlug
      ? `/api/public/my-loans/${encodeURIComponent(librarySlug)}?identifier=${encodeURIComponent(identifier)}`
      : `/api/public/my-loans?identifier=${encodeURIComponent(identifier)}`;
    const response = await fetch(endpoint);
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || 'No se pudieron encontrar préstamos.');
      setLoans([]);
      setLoading(false);
      return;
    }

    setLoans(payload.loans || []);
    setMessage(payload.loans?.length ? null : 'No se encontraron préstamos para ese identificador en esta biblioteca.');
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#ffffff_45%,_#f7f4ec_100%)] px-6 py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex justify-start">
          <Link href={librarySlug ? `/l/${librarySlug}` : '/'} className="rounded-full bg-white/80 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white shadow-sm transition">
            &larr; Volver al catálogo
          </Link>
        </div>

        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Consulta de Préstamos</p>
          <h1 className="font-serif text-5xl text-slate-900 leading-tight">Encuentra todas tus solicitudes.</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">
            Los resultados están limitados a la biblioteca actual para garantizar tu privacidad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email, ID nacional o carnet estudiantil"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none"
            />
            <button className="rounded-2xl bg-slate-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 shadow-md">
              {loading ? 'Buscando...' : 'Buscar préstamos'}
            </button>
          </div>
        </form>

        {message && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

        <div className="space-y-4">
          {loans.map((loan) => (
            <article key={loan.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 hover:border-slate-300 transition shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{loan.book?.categories?.join(', ') || 'Libro'}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900 leading-tight">{loan.book?.title || 'Título desconocido'}</h2>
                  <p className="mt-1 text-sm text-slate-600">{loan.book?.author || 'Autor desconocido'}</p>
                </div>
                <span className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider",
                  loan.status === 'pending' ? "bg-amber-100 text-amber-700" :
                    loan.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                      "bg-slate-100 text-slate-600"
                )}>
                  {loan.status}
                </span>
              </div>
              <div className="mt-6 grid gap-4 text-sm text-slate-600 md:grid-cols-3 border-t border-slate-50 pt-5">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Solicitado por</p>
                  <p className="mt-1 font-semibold text-slate-900">{loan.full_name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Copias</p>
                  <p className="mt-1 font-semibold text-slate-900">{loan.requested_copies}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Fecha</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(loan.created_at)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

