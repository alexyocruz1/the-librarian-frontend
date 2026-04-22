'use client';

import Link from 'next/link';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/context/I18nContext';

export default function RootHostLanding() {
  const { t } = useI18n();

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <LanguageSwitcher />
      
      <div className="w-full max-w-lg text-center">
        <h1 className="font-serif text-6xl font-bold tracking-tight text-slate-900 md:text-7xl">
          {t('app.title') || 'The Librarian'}
        </h1>
        
        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link 
            href="/auth/login" 
            className="flex-1 rounded-full bg-slate-900 px-6 py-4 text-center text-sm font-semibold text-white shadow-xl hover:bg-slate-800 transition"
          >
            {t('landing.librarian') || "I'm a Librarian"}
          </Link>
          <Link 
            href="/libraries" 
            className="flex-1 rounded-full border-2 border-slate-900 bg-white px-6 py-4 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            {t('landing.books') || "I'm looking for books"}
          </Link>
        </div>
      </div>
    </main>
  );
}
