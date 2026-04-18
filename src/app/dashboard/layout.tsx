import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getLibrarianSession, listAccessibleLibraries } from '@/lib/library-data';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getLibrarianSession();

  if (!session) {
    redirect('/auth/login');
  }

  const libraries = await listAccessibleLibraries(session);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f6f8fb_0%,_#ffffff_40%,_#fff8ef_100%)]">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-slate-200 bg-white p-6 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Sesión iniciada</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">{session.full_name}</h2>
          <p className="mt-1 text-sm text-slate-500">{session.email}</p>

          <nav className="mt-8 space-y-2">
            <Link href="/dashboard" className="block rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              Préstamos
            </Link>
            <Link href="/dashboard/books" className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              Inventario
            </Link>
          </nav>

          <div className="mt-8 rounded-[1.75rem] bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tus Bibliotecas</p>
            <div className="mt-3 space-y-2">
              {libraries.map((library) => (
                <div key={library.id} className="rounded-2xl bg-white px-3 py-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">{library.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{library.subdomain}.yourdomain.com</p>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
