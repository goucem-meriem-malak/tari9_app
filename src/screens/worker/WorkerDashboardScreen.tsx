import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/useAuthStore';
import { subscribeToProviderRequests, updateRequestState } from '@/services/requests';
import { setProviderAvailability } from '@/services/providerProfile';
import { sendPushNotification } from '@/services/push';
import { getServiceType } from '@/config/serviceTypes';
import { ServiceRequest } from '@/types';
import { colors } from '@/constants/colors';

// Shown next to a client's name wherever the provider sees a request.
// Deliberately just a checkmark + word - the provider never sees the ID
// itself, only that one is on file (see ServiceRequest.clientIdVerified).
function VerifiedBadge() {
  return (
    <View style={styles.verifiedBadge}>
      <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
    </View>
  );
}

function ExtraDetails({ request }: { request: ServiceRequest }) {
  if (!request.extra) return null;
  const service = getServiceType(request.type);
  const fields = service.extraFields ?? [];
  return (
    <View style={styles.extraWrap}>
      {fields.map((field) => {
        const raw = request.extra?.[field.key];
        if (raw === undefined || raw === '') return null;
        const display =
          field.type === 'select' ? field.options?.find((o) => o.value === raw)?.label ?? raw : raw;
        return (
          <Text key={field.key} style={styles.extraLine}>
            <Text style={styles.extraLabel}>{field.label}: </Text>
            {display}
            {field.unit ? ` ${field.unit}` : ''}
          </Text>
        );
      })}
    </View>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, 'WorkerDashboard'>;

export default function WorkerDashboardScreen({ navigation }: Props) {
  const { providerProfile, setProviderProfile } = useAuthStore();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    if (!providerProfile) return;
    const unsub = subscribeToProviderRequests(providerProfile.id, setRequests);
    return unsub;
  }, [providerProfile?.id]);

  const pending = useMemo(() => requests.filter((r) => r.state === 'pending'), [requests]);
  const activeJob = useMemo(() => requests.find((r) => r.state === 'accepted'), [requests]);

  async function handleToggleAvailability(value: boolean) {
    if (!providerProfile) return;
    setTogglingAvailability(true);
    await setProviderAvailability(providerProfile.id, value);
    setProviderProfile({ ...providerProfile, available: value });
    setTogglingAvailability(false);
  }

  async function handleAccept(request: ServiceRequest) {
    await updateRequestState(request.id, 'accepted');
    sendPushNotification(
      request.clientPushToken,
      'Request accepted',
      `${providerProfile?.name ?? 'Your provider'} is on the way!`,
      { requestId: request.id }
    );
  }

  async function handleDecline(request: ServiceRequest) {
    await updateRequestState(request.id, 'declined');
  }

  async function handleComplete(request: ServiceRequest) {
    await updateRequestState(request.id, 'completed');
  }

  if (!providerProfile) return null;
  const service = getServiceType(providerProfile.type);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.businessName}>
            {service.icon} {providerProfile.name}
          </Text>
          <Text style={styles.serviceLabel}>{service.label}</Text>
        </View>
        <View style={styles.availabilityWrap}>
          <Text style={styles.availabilityLabel}>
            {providerProfile.available ? 'Online' : 'Offline'}
          </Text>
          <Switch
            value={providerProfile.available}
            onValueChange={handleToggleAvailability}
            disabled={togglingAvailability}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>
      </View>

      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {activeJob && (
              <View style={styles.activeCard}>
                <Text style={styles.sectionTitle}>Active Job</Text>
                <View style={styles.nameRow}>
                  <Text style={styles.clientName}>{activeJob.clientName || 'Client'}</Text>
                  {activeJob.clientIdVerified && <VerifiedBadge />}
                </View>
                <Text style={styles.meta}>
                  {(activeJob.distanceMeters / 1000).toFixed(1)} km · {activeJob.address.city ?? ''} ·{' '}
                  {getServiceType(activeJob.type).pricingDisplay === 'estimateOnly' ? '~' : ''}
                  {activeJob.price} DA
                </Text>
                <ExtraDetails request={activeJob} />
                <View style={styles.activeActions}>
                  {activeJob.clientPhone ? (
                    <Pressable
                      style={styles.callButton}
                      onPress={() => Linking.openURL(`tel:${activeJob.clientPhone}`)}
                    >
                      <Text style={styles.callText}>Call Client</Text>
                    </Pressable>
                  ) : null}
                  <Pressable style={styles.completeButton} onPress={() => handleComplete(activeJob)}>
                    <Text style={styles.completeText}>Mark Completed</Text>
                  </Pressable>
                </View>
              </View>
            )}
            <Text style={styles.sectionTitle}>
              Incoming Requests {pending.length > 0 ? `(${pending.length})` : ''}
            </Text>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {providerProfile.available
              ? 'No incoming requests right now.'
              : "You're offline - go online to receive requests."}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.requestCard}>
            <View style={styles.nameRow}>
              <Text style={styles.clientName}>{item.clientName || 'Client'}</Text>
              {item.clientIdVerified && <VerifiedBadge />}
            </View>
            <Text style={styles.meta}>
              {(item.distanceMeters / 1000).toFixed(1)} km · {item.address.city ?? ''} ·{' '}
              {getServiceType(item.type).pricingDisplay === 'estimateOnly' ? '~' : ''}
              {item.price} DA
            </Text>
            <ExtraDetails request={item} />
            <View style={styles.requestActions}>
              <Pressable style={styles.declineButton} onPress={() => handleDecline(item)}>
                <Text style={styles.declineText}>Decline</Text>
              </Pressable>
              <Pressable style={styles.acceptButton} onPress={() => handleAccept(item)}>
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={styles.footerNav}>
        <Pressable onPress={() => navigation.navigate('WorkerHistory')}>
          <Text style={styles.footerLink}>History</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('WorkerProfile')}>
          <Text style={styles.footerLink}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  businessName: { fontSize: 18, fontWeight: '700', color: colors.text },
  serviceLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  availabilityWrap: { alignItems: 'center' },
  availabilityLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  list: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase' },
  activeCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clientName: { fontSize: 16, fontWeight: '700', color: colors.text },
  verifiedBadge: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  verifiedBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  activeActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  callButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  callText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  completeButton: { flex: 1, backgroundColor: colors.success, borderRadius: 8, padding: 12, alignItems: 'center' },
  completeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  declineButton: { flex: 1, backgroundColor: colors.danger, borderRadius: 8, padding: 12, alignItems: 'center' },
  declineText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  acceptButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 20, fontSize: 13 },
  extraWrap: { marginTop: 10, gap: 2 },
  extraLine: { fontSize: 12, color: colors.text },
  extraLabel: { color: colors.textMuted },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerLink: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
