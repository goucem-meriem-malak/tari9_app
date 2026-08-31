import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/constants/colors';

/**
 * Sits above the navigator so it's visible on every screen, signed-in or
 * not. Nothing to tap, nothing to configure - it just tells the truth about
 * connectivity so a screen never has to leave the person guessing why
 * something is stuck. Auto-hides itself the instant the connection returns.
 */
export default function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.text}>You're offline - some features won't work until you reconnect</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.danger,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
