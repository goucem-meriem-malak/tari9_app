import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/store/useLocaleStore';
import { subscribeToClientHistory } from '@/services/requests';
import { ServiceRequest } from '@/types';
import { getServiceType } from '@/config/serviceTypes';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestHistory'>;

const STATE_COLOR: Record<ServiceRequest['state'], string> = {
  pending: colors.warning,
  accepted: colors.success,
  declined: colors.danger,
  completed: colors.primary,
  cancelled: colors.textMuted,
};

export default function RequestHistoryScreen({ navigation }: Props) {
  const t = useT();
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    if (!firebaseUid) return;
    const unsub = subscribeToClientHistory(firebaseUid, setRequests);
    return unsub;
  }, [firebaseUid]);

  // Arabic gets its own date formatting (e.g. Arabic-Indic digits/month
  // names per device settings) instead of always rendering the en-US style.
  const dateLocale = t.locale === 'ar' ? 'ar-DZ' : 'en-US';

  if (requests.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('requestHistory.empty')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const service = getServiceType(item.type);
        const needsPayment = item.state === 'completed' && item.paymentStatus !== 'paid';
        return (
          <Pressable
            style={styles.row}
            disabled={!needsPayment}
            onPress={() => navigation.navigate('Payment', { requestId: item.id })}
          >
            <Text style={styles.icon}>{service.icon}</Text>
            <View style={styles.info}>
              <Text style={styles.label}>{t(`services.${item.type}.label`)}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString(dateLocale)}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>{item.price} {t('common.currency')}</Text>
              <Text style={[styles.state, { color: STATE_COLOR[item.state] }]}>
                {t(`requestStates.${item.state}`)}
              </Text>
              {needsPayment && (
                <Text style={styles.unpaid}>{t('requestHistory.payNow')}</Text>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 24, marginRight: 12 },
  info: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 14, fontWeight: '700', color: colors.text },
  state: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  unpaid: { fontSize: 11, fontWeight: '700', color: colors.warning, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textMuted },
});
