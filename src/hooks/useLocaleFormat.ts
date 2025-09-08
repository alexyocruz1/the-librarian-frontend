'use client';

import { useI18n } from '@/context/I18nContext';

export function useLocaleFormat() {
  const { locale } = useI18n();

  const formatDate = (date: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'short', day: '2-digit',
      ...options,
    }).format(d);
  };

  const formatDateTime = (date: string | Date, options: Intl.DateTimeFormatOptions = {}) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
      ...options,
    }).format(d);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    try { return new Intl.NumberFormat(locale, options).format(num); } catch { return String(num); }
  };

  const formatCurrency = (amount: number, currency: string = 'USD', options?: Intl.NumberFormatOptions) => {
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency, ...options }).format(amount); } catch { return String(amount); }
  };

  return { locale, formatDate, formatDateTime, formatNumber, formatCurrency };
}


