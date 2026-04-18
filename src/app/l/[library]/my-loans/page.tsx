import { notFound } from 'next/navigation';
import MyLoansLookup from '@/components/tenant/MyLoansLookup';
import { resolveLibrary } from '@/lib/library-data';

export default async function LibraryLoansPage({ params }: { params: Promise<{ library: string }> }) {
  const { library } = await params;
  const tenant = await resolveLibrary(library);

  if (!tenant) {
    notFound();
  }

  return <MyLoansLookup librarySlug={library} />;
}
