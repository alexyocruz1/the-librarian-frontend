import MyLoansLookup from '@/components/tenant/MyLoansLookup';
import RootHostLanding from '@/components/tenant/RootHostLanding';
import { getRequestSubdomain } from '@/lib/tenant';

export default async function MyLoansPage() {
  const subdomain = await getRequestSubdomain();

  if (!subdomain) {
    return <RootHostLanding />;
  }

  return <MyLoansLookup />;
}
