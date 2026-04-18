'use client';

import { FormEvent, useState } from 'react';
import { TenantLoan } from '@/types/tenant';
import { formatDateTime } from '@/lib/utils';

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
      setMessage(payload.error || 'Unable to find loans.');
      setLoans([]);
      setLoading(false);
      return;
    }

    setLoans(payload.loans || []);
    setMessage(payload.loans?.length ? null : 'No loans were found for that identifier in this library.');
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#ffffff_45%,_#f7f4ec_100%)] px-6 py-14">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Loan lookup</p>
          <h1 className="font-serif text-5xl text-slate-900">Find every request tied to your identifier.</h1>
          <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">
            Results stay scoped to the current library, so patrons only see their own local request history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="Email, national ID, or student ID"
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
            <button className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
              {loading ? 'Searching...' : 'Search loans'}
            </button>
          </div>
        </form>

        {message && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

        <div className="space-y-4">
          {loans.map((loan) => (
            <article key={loan.id} className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{loan.book?.category || 'Book'}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{loan.book?.title || 'Unknown title'}</h2>
                  <p className="mt-1 text-sm text-slate-600">{loan.book?.author || 'Unknown author'}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">{loan.status}</span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <p>Requested by: <span className="font-semibold text-slate-900">{loan.full_name}</span></p>
                <p>Copies: <span className="font-semibold text-slate-900">{loan.requested_copies}</span></p>
                <p>Submitted: <span className="font-semibold text-slate-900">{formatDateTime(loan.created_at)}</span></p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
