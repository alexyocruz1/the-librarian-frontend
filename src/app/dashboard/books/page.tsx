import BookManagementClient from '@/components/tenant/BookManagementClient';
import { getLibrarianSession, listAccessibleLibraries } from '@/lib/library-data';

export default async function DashboardBooksPage() {
  const session = await getLibrarianSession();

  if (!session) {
    return null;
  }

  const libraries = await listAccessibleLibraries(session);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Control de Inventario</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Administra los libros de cada biblioteca asignada.</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          Agrega, actualiza y elimina libros de tus sedes. Los valores del inventario siempre estarán protegidos y organizados por ubicación.
        </p>
      </div>
      <BookManagementClient libraries={libraries} />
    </div>
  );
}
