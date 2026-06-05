// Translation helper. Looks up key in current locale, falls back to English,
// then to the key itself. Server-safe (pure function).

export function translate(
  i18n: Record<string, Record<string, string>> | undefined,
  locale: string,
  key: string,
  fallback?: string,
): string {
  if (!i18n) return fallback ?? key;
  const fromLocale = i18n[locale]?.[key];
  if (fromLocale) return fromLocale;
  if (locale !== 'en') {
    const fromEn = i18n.en?.[key];
    if (fromEn) return fromEn;
  }
  return fallback ?? key;
}

export function listLocales(i18n: Record<string, Record<string, string>> | undefined, defaults: string[] = ['en']) {
  const set = new Set<string>(defaults);
  if (i18n) for (const k of Object.keys(i18n)) set.add(k);
  return Array.from(set);
}
