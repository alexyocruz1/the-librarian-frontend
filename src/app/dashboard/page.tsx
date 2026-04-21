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
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Panel de Control</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Administra los préstamos de cada biblioteca fácilmente.</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          El inventario solo se actualiza cuando los libros se entregan o se devuelven físicamente, garantizando un control preciso de la disponibilidad.
        </p>
      </div>
      <DashboardClient libraries={libraries} />
    </div>
  );
}
