import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ServiceTypeConfig } from '@/config/serviceTypes';
import { colors } from '@/constants/colors';
import { useT } from '@/store/useLocaleStore';

interface Props {
  service: ServiceTypeConfig;
  onPress: () => void;
}

export default function ServiceTypeCard({ service, onPress }: Props) {
  const t = useT();
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{service.icon}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{t(`services.${service.id}.label`)}</Text>
        <Text style={styles.description}>{t(`services.${service.id}.description`)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 32, marginRight: 14 },
  textWrap: { flex: 1 },
  label: { fontSize: 17, fontWeight: '600', color: colors.text },
  description: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
});
