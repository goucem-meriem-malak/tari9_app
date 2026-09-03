import React from 'react';
import { Alert, I18nManager, Pressable, StyleSheet, Text } from 'react-native';
import * as Updates from 'expo-updates';
import { useLocaleStore } from '@/store/useLocaleStore';
import { isRTL, Locale } from '@/i18n';
import { colors } from '@/constants/colors';

/**
 * Small EN/AR switcher. Drop it into any screen's header area.
 *
 * Switching locale is instant for text. Switching layout DIRECTION
 * (LTR <-> RTL) is a native-level change React Native only applies on
 * next launch, so when the new locale's RTL-ness differs from the
 * current one, this prompts for a restart via expo-updates. In Expo Go
 * (where Updates.reloadAsync isn't available) it falls back to asking
 * the person to close and reopen the app manually.
 */
export default function LanguageToggle() {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  async function handleToggle() {
    const next: Locale = locale === 'en' ? 'ar' : 'en';
    const needsRestart = isRTL(next) !== isRTL(locale);
    await setLocale(next);

    if (!needsRestart) return;

    I18nManager.forceRTL(isRTL(next));
    I18nManager.allowRTL(isRTL(next));

    try {
      await Updates.reloadAsync();
    } catch {
      Alert.alert(
        next === 'ar' ? 'أعد فتح التطبيق' : 'Restart required',
        next === 'ar'
          ? 'أغلق التطبيق وأعد فتحه لتطبيق تخطيط اللغة العربية.'
          : 'Close and reopen the app to apply the layout direction change.'
      );
    }
  }

  return (
    <Pressable style={styles.wrap} onPress={handleToggle} hitSlop={10}>
      <Text style={styles.text}>{locale === 'en' ? 'العربية' : 'English'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: { fontSize: 12, fontWeight: '600', color: colors.primary },
});
