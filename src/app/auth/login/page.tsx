import Link from 'next/link';
import LibrarianLoginForm from '@/components/tenant/LibrarianLoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fffaf0_0%,_#ffffff_50%,_#eef5ff_100%)] px-6 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Subdomain-based multi-tenancy</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight">One librarian role. Clean public browsing. Strict library isolation.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
            Each request is scoped by subdomain, every book and loan stays attached to its library, and inventory is only adjusted on handled and returned transitions.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Public user flow</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">Browse available books, request loans without creating an account, then look up loans by identifier.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Librarian flow</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">Approve, reject, handle, and return loans only inside the libraries assigned to the authenticated librarian.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">Back to catalog</Link>
            <Link href="/my-loans" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">Loan lookup</Link>
          </div>
        </section>

        <section className="flex items-center">
          <LibrarianLoginForm />
        </section>
      </div>
    </main>
  );
}
