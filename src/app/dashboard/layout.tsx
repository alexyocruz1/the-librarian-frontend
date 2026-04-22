import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getLibrarianSession, listAccessibleLibraries } from '@/lib/library-data';
import ResponsiveSidebar from '@/components/tenant/ResponsiveSidebar';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getLibrarianSession();

  if (!session) {
    redirect('/auth/login');
  }

  const libraries = await listAccessibleLibraries(session);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_rgba(246,248,251,0.7)_0%,_rgba(255,255,255,0.8)_40%,_rgba(255,248,239,0.7)_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 py-0 lg:flex-row lg:px-6 lg:py-8">
        <ResponsiveSidebar session={session} libraries={libraries} />
        <section className="min-w-0 flex-1 px-6 py-8 lg:p-0">{children}</section>
      </div>
    </main>
  );
}

