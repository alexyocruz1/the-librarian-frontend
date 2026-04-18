import { listPublicLibraries } from '@/lib/library-data';
import LibraryPickerClient from '@/components/public/LibraryPickerClient';

export default async function LibrariesPage() {
  const libraries = await listPublicLibraries();

  return <LibraryPickerClient libraries={libraries} />;
}
