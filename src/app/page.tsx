import RootHostLanding from '@/components/tenant/RootHostLanding';
import PublicCatalog from '@/components/tenant/PublicCatalog';
import { resolveLibrary } from '@/lib/library-data';
import { getRequestSubdomain } from '@/lib/tenant';

export default async function HomePage() {
  const subdomain = await getRequestSubdomain();

  if (!subdomain) {
    return <RootHostLanding />;
  }

  const library = await resolveLibrary(subdomain);

  if (!library) {
    return <RootHostLanding />;
  }

  return <PublicCatalog />;
}
