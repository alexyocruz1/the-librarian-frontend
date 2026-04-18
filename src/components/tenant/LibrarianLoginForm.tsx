'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/context/I18nContext';

export default function LibrarianLoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState('ana@librarian.test');
  const [password, setPassword] = useState('library123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || t('requests.error.description') || 'Unable to sign in.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="w-full relative">
      <LanguageSwitcher />
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.35)]">
        <div>
          <h1 className="font-serif text-3xl font-bold text-slate-900 text-center">{t('auth.login.title') || 'Login'}</h1>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">{t('auth.login.email.label') || 'Email'}</span>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">{t('auth.login.password.label') || 'Password'}</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
        </label>

        {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
          {loading ? t('auth.login.button.loading') || 'Signing in...' : t('auth.login.button.idle') || 'Enter dashboard'}
        </button>
      </form>
    </div>
  );
}
