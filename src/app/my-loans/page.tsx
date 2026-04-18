import MyLoansLookup from '@/components/tenant/MyLoansLookup';
import RootHostLanding from '@/components/tenant/RootHostLanding';
import { resolveLibrary } from '@/lib/library-data';
import { getRequestSubdomain } from '@/lib/tenant';

export default async function MyLoansPage() {
  const subdomain = await getRequestSubdomain();

  if (!subdomain) {
    return <RootHostLanding />;
  }

  const library = await resolveLibrary(subdomain);

  if (!library) {
    return <RootHostLanding />;
  }

  return <MyLoansLookup />;
}
