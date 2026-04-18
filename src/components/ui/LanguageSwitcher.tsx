'use client';

import { useI18n } from '@/context/I18nContext';
import { SupportedLocale } from '@/i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className="absolute right-6 top-6 flex items-center gap-2 z-50">
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        className="rounded-full border border-slate-200 bg-white/50 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
        aria-label="Select language"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
      </select>
    </div>
  );
}
