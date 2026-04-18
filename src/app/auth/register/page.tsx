import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f8fbff_0%,_#ffffff_45%,_#fff7ed_100%)] px-6 py-16">
      <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white p-8 text-center shadow-[0_30px_90px_-55px_rgba(15,23,42,0.35)] md:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Librarian-only authentication</p>
        <h1 className="mt-4 font-serif text-5xl text-slate-900">Public visitors do not need to register.</h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Patrons can browse books, submit a loan request, and look up their requests by identifier. Only librarians sign in, and their access is limited to the libraries assigned to them.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
            Browse catalog
          </Link>
          <Link href="/auth/login" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Librarian sign in
          </Link>
          <Link href="/my-loans" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
            Find my loans
          </Link>
        </div>
      </div>
    </main>
  );
}
