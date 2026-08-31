import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Provider } from '@/types';
import { colors } from '@/constants/colors';

interface Props {
  provider: Provider;
  price: number;
  priceLabel?: string;
  onPress: () => void;
}

export default function ProviderCard({ provider, price, priceLabel, onPress }: Props) {
  const km = ((provider.distanceMeters ?? 0) / 1000).toFixed(1);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{provider.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.meta}>{km} km away{provider.rating ? ` · ★ ${provider.rating.toFixed(1)}` : ''}</Text>
      </View>
      <Text style={styles.price}>{priceLabel ?? `${price} DA`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
