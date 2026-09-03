import 'react-native-get-random-values'; // must be first import - gives crypto-js real randomness on RN
import React, { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '@/navigation/RootNavigator';
import AnimatedSplash from '@/components/AnimatedSplash';
import { useLocaleStore } from '@/store/useLocaleStore';
import { isRTL } from '@/i18n';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const hydrate = useLocaleStore((s) => s.hydrate);
  const hydrated = useLocaleStore((s) => s.hydrated);
  const locale = useLocaleStore((s) => s.locale);

  // Load the saved locale before rendering anything that reads it, and
  // make sure the native layout direction (I18nManager) actually matches
  // whatever locale was saved from a previous session. If someone force-
  // quit the app mid-restart after switching to Arabic, this keeps the
  // two in sync on next launch instead of leaving Arabic text stuck in
  // an LTR layout.
  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const wantsRTL = isRTL(locale);
    if (I18nManager.isRTL !== wantsRTL) {
      I18nManager.forceRTL(wantsRTL);
      I18nManager.allowRTL(wantsRTL);
      // Not calling Updates.reloadAsync() here on purpose - this only
      // runs once at cold start (before any RTL-sensitive UI has
      // rendered), so a reload isn't needed; it's the mid-session
      // toggle (LanguageToggle) that needs one.
    }
  }, [hydrated, locale]);

  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={showSplash ? 'light' : 'dark'} />
      {showSplash ? (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      ) : (
        <RootNavigator />
      )}
    </SafeAreaProvider>
  );
}
