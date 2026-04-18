import DashboardClient from '@/components/tenant/DashboardClient';
import { getLibrarianSession, listAccessibleLibraries } from '@/lib/library-data';

export default async function DashboardPage() {
  const session = await getLibrarianSession();

  if (!session) {
    return null;
  }

  const libraries = await listAccessibleLibraries(session);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Librarian dashboard</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Handle requests without losing tenant boundaries.</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          Inventory moves only when books are physically handed out or returned, and every transition is expected to be enforced inside a database transaction.
        </p>
      </div>
      <DashboardClient libraries={libraries} />
    </div>
  );
}
