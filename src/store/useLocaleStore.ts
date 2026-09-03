import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale, t as translate } from '@/i18n';

const STORAGE_KEY = 'tari9.locale';

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  hydrate: () => Promise<void>;
}

/**
 * Persisted app locale. Changing it only swaps which strings render -
 * it does NOT flip RTL layout direction on its own (see App.tsx), since
 * React Native's I18nManager needs a full app reload to apply a layout
 * direction change. setLocale() saves the new value and the caller
 * (LanguageToggle) is responsible for prompting a restart when the RTL-
 * ness of the new locale differs from the current one.
 */
export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'en',
  hydrated: false,
  setLocale: async (locale) => {
    await AsyncStorage.setItem(STORAGE_KEY, locale);
    set({ locale });
  },
  hydrate: async () => {
    const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Locale | null;
    set({ locale: stored ?? 'en', hydrated: true });
  },
}));

/**
 * `const t = useT(); t('auth.signIn')` - bound to the current locale.
 * Also returns the active locale itself as `t.locale`, so screens that
 * need it directly (date formatting, RTL-aware layout tweaks, building
 * a service label from config data) don't need a second store read.
 */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  const fn = (path: string, params?: Record<string, string | number>) => translate(path, locale, params);
  fn.locale = locale;
  return fn;
}
