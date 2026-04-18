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
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Inventory control</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Books remain scoped to the librarian’s assigned libraries.</h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">
          Add, update, and remove catalog records per tenant without leaking access across libraries. Inventory values stay validated at save time.
        </p>
      </div>
      <BookManagementClient libraries={libraries} />
    </div>
  );
}
