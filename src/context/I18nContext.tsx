'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { defaultLocale, getMessages, supportedLocales, type SupportedLocale } from '@/i18n';
import { usePreferences } from '@/context/PreferencesContext';

type Messages = Record<string, string>;

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { preferences } = usePreferences();
  const [locale, setLocaleState] = useState<SupportedLocale>(defaultLocale);
  const [messages, setMessages] = useState<Messages>({});

  const setLocale = (loc: SupportedLocale) => {
    setLocaleState(loc);
  };

  useEffect(() => {
    // Determine initial locale from preferences or browser
    const preferred = (preferences.language as SupportedLocale) || defaultLocale;
    const browser = typeof navigator !== 'undefined' ? (navigator.language?.slice(0, 2) as SupportedLocale) : defaultLocale;
    const initial = supportedLocales.includes(preferred) ? preferred : (supportedLocales.includes(browser) ? browser : defaultLocale);
    setLocaleState(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getMessages(locale);
      if (active) setMessages(data as Messages);
    })();
    return () => { active = false; };
  }, [locale]);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      let text = messages[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }
      return text;
    };
  }, [messages]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}


