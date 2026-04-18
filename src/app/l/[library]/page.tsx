import { notFound } from 'next/navigation';
import PublicCatalog from '@/components/tenant/PublicCatalog';
import { resolveLibrary } from '@/lib/library-data';

export default async function LibraryCatalogPage({ params }: { params: Promise<{ library: string }> }) {
  const { library } = await params;
  const tenant = await resolveLibrary(library);

  if (!tenant) {
    notFound();
  }

  return <PublicCatalog librarySlug={library} />;
}
