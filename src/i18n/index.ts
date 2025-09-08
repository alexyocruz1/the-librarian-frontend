export const supportedLocales = ['en', 'es'] as const;
export type SupportedLocale = typeof supportedLocales[number];

export const defaultLocale: SupportedLocale = 'en';

export async function getMessages(locale: SupportedLocale) {
  switch (locale) {
    case 'es':
      return (await import('./messages/es.json')).default;
    case 'en':
    default:
      return (await import('./messages/en.json')).default;
  }
}


