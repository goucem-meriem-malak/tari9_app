import { en, TranslationSchema } from './locales/en';
import { ar } from './locales/ar';

export type Locale = 'en' | 'ar';

export const RTL_LOCALES: Locale[] = ['ar'];

export const translations: Record<Locale, TranslationSchema> = { en, ar };

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Looks up a dot-path ('auth.signIn') inside a locale's string tree.
 * Falls back to the English string (then to the key itself) if a
 * translation is somehow missing at runtime, so a bad key never crashes
 * a screen - it just shows something instead of nothing.
 *
 * Optional `params` fills in `{token}` placeholders inside the string,
 * e.g. t('providerCard.kmAway', locale, { km: '3.2' }) ->
 * "3.2 km away" / "على بعد 3.2 كم". Kept deliberately simple (no plurals,
 * no nesting) since the app's strings never need more than that.
 */
export function t(path: string, locale: Locale, params?: Record<string, string | number>): string {
  const lookup = (tree: any): string | undefined =>
    path.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), tree);

  const raw = lookup(translations[locale]) ?? lookup(translations.en) ?? path;
  if (!params) return raw;
  return Object.keys(params).reduce(
    (str, key) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(params[key])),
    raw
  );
}
