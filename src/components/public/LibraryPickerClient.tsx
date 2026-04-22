'use client';

import Link from 'next/link';
import { LibraryTenant } from '@/types/tenant';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/context/I18nContext';

interface LibraryPickerClientProps {
  libraries: LibraryTenant[];
}

export default function LibraryPickerClient({ libraries }: LibraryPickerClientProps) {
  const { t } = useI18n();

  return (
    <main className="relative min-h-screen bg-[linear-gradient(180deg,_rgba(255,250,240,0.75)_0%,_rgba(255,255,255,0.85)_45%,_rgba(238,245,255,0.75)_100%)] px-6 py-16">
      <LanguageSwitcher />

      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-5xl font-bold tracking-tight text-slate-900">
            {t('common.selectLibrary') || 'Choose a library'}
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            {t('common.selectLibraryDesc') || 'Select the library you want to browse and borrow from.'}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-12">
          {libraries.map((lib) => (
            <Link 
              key={lib.id} 
              href={`/l/${lib.subdomain}`} 
              className="flex flex-col rounded-3xl bg-white p-6 shadow-sm border border-slate-200 transition hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <h2 className="text-xl font-bold text-slate-900">{lib.name}</h2>
              {lib.city && <p className="mt-1 text-sm font-medium uppercase tracking-widest text-slate-500">{lib.city}</p>}
              {lib.description && <p className="mt-4 text-sm text-slate-600">{lib.description}</p>}
            </Link>
          ))}
          {libraries.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No libraries found.
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="inline-block rounded-full bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
            {t('common.backToHome') || 'Back to home'}
          </Link>
        </div>
      </div>
    </main>
  );
}
