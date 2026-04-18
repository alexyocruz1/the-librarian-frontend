import Link from 'next/link';

export default function RootHostLanding() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#fffaf0_0%,_#ffffff_45%,_#eef5ff_100%)] px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Multi-tenant entry</p>
          <h1 className="font-serif text-5xl text-slate-900 md:text-6xl">Open a library from its subdomain.</h1>
          <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600">
            Public catalog pages and loan lookups only work when the request resolves to a specific library like
            <span className="font-semibold text-slate-900"> honduras.yourdomain.com</span>.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">For patrons</p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use the assigned library link to browse books, request loans, and look up your requests by identifier.
            </p>
            <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-700">
              Example paths:
              <div className="mt-2 font-semibold text-slate-900">/l/honduras</div>
              <div className="mt-1 font-semibold text-slate-900">/l/newyork</div>
            </div>
          </section>

          <section className="rounded-[2rem] bg-slate-950 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">For librarians</p>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Sign in from the main domain, then manage only the libraries assigned to your account.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/auth/login" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950">
                Librarian sign in
              </Link>
              <Link href="/auth/register" className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white">
                Access info
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
