'use client';
// Translation hook. Provides a `t(key, fallback)` function based on the
// current app's i18n config. Client-side, looks up window.__APP_I18N__ / __LOCALE__.
import * as React from 'react';
import { translate } from '@/lib/i18n';

interface Ctx { i18n?: Record<string, Record<string, string>>; locale: string }

let ctx: Ctx | null = null;

export function setI18nContext(c: Ctx) { ctx = c; }
export function useT() {
  const c = ctx ?? { i18n: undefined, locale: 'en' };
  return (key: string, fallback?: string) => translate(c.i18n, c.locale, key, fallback);
}
