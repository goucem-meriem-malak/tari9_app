import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/store/useLocaleStore';
import { subscribeToProviderRequests } from '@/services/requests';
import { ServiceRequest } from '@/types';
import { colors } from '@/constants/colors';

const STATE_COLOR: Record<ServiceRequest['state'], string> = {
  pending: colors.warning,
  accepted: colors.success,
  declined: colors.danger,
  completed: colors.primary,
  cancelled: colors.textMuted,
};

export default function WorkerHistoryScreen() {
  const t = useT();
  const providerProfile = useAuthStore((s) => s.providerProfile);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    if (!providerProfile) return;
    const unsub = subscribeToProviderRequests(providerProfile.id, setRequests);
    return unsub;
  }, [providerProfile?.id]);

  // Only show finished jobs here - pending/active live on the dashboard
  const history = requests.filter(
    (r) => r.state === 'completed' || r.state === 'declined' || r.state === 'cancelled'
  );

  const dateLocale = t.locale === 'ar' ? 'ar-DZ' : 'en-US';

  if (history.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('workerHistory.empty')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.list}
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.clientName || t('workerHistory.clientFallback')}</Text>
              {item.clientIdVerified && <Text style={styles.verified}>{t('worker.verified')}</Text>}
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString(dateLocale)}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.price}>{item.price} {t('common.currency')}</Text>
            <Text style={[styles.state, { color: STATE_COLOR[item.state] }]}>{t(`requestStates.${item.state}`)}</Text>
            {item.state === 'completed' && (
              <Text style={[styles.paid, { color: item.paymentStatus === 'paid' ? colors.success : colors.warning }]}>
                {item.paymentStatus === 'paid' ? t('workerHistory.paid') : t('workerHistory.unpaid')}
              </Text>
            )}
          </View>
        </View>
      )}
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
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  verified: { fontSize: 10, fontWeight: '700', color: colors.primary },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 14, fontWeight: '700', color: colors.text },
  state: { fontSize: 11, fontWeight: '600', marginTop: 2, textTransform: 'uppercase' },
  paid: { fontSize: 10, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textMuted },
});
