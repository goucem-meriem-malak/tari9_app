import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { subscribeToRequest, cancelRequest } from '@/services/requests';
import { ServiceRequest } from '@/types';
import { useRequestStore } from '@/store/useRequestStore';
import { getServiceType } from '@/config/serviceTypes';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestStatus'>;

const STATE_LABEL: Record<ServiceRequest['state'], string> = {
  pending: 'Waiting for a provider to accept...',
  accepted: 'Provider is on the way!',
  declined: 'Provider declined this request.',
  completed: 'Service completed.',
  cancelled: 'Request cancelled.',
};

export default function RequestStatusScreen({ route, navigation }: Props) {
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const resetFlow = useRequestStore((s) => s.reset);
  const startFollowUp = useRequestStore((s) => s.startFollowUp);
  const setLocation = useRequestStore((s) => s.setLocation);
  const hasPromptedFollowUp = useRef(false);
  const { isOffline } = useNetworkStatus();

  useEffect(() => {
    const unsub = subscribeToRequest(requestId, setRequest);
    return unsub;
  }, [requestId]);

  // Ambulance <-> taxi cross-suggestion: fires once, right after the request
  // is first loaded, regardless of whether it's later accepted/declined.
  useEffect(() => {
    if (!request || hasPromptedFollowUp.current) return;
    hasPromptedFollowUp.current = true;

    if (request.type === 'ambulance') {
      Alert.alert(
        'Need a ride for the rest of the group?',
        'If some of your group are unhurt and need to get home, we can send a taxi to the same location.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Request a Taxi', onPress: () => startFollowUpRequest('taxi') },
        ]
      );
    } else if (request.type === 'taxi') {
      Alert.alert(
        'Is anyone hurt?',
        "If this is from an accident and someone needs medical help, you can also request an ambulance to the same location.",
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Request an Ambulance', onPress: () => startFollowUpRequest('ambulance') },
        ]
      );
    }
  }, [request]);

  function startFollowUpRequest(type: 'taxi' | 'ambulance') {
    if (!request) return;
    startFollowUp(type);
    setLocation(request.clientLocation, request.address);
    const service = getServiceType(type);
    navigation.navigate(service.extraFields?.length ? 'RequestDetails' : 'ProviderList');
  }

  async function handleCancel() {
    Alert.alert('Cancel request?', 'This will stop the search for a provider.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          await cancelRequest(requestId);
          resetFlow();
          navigation.navigate('ServiceSelect');
        },
      },
    ]);
  }

  function handleDone() {
    resetFlow();
    navigation.navigate('ServiceSelect');
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.status}>
          {isOffline ? "You're offline - this will load once you reconnect." : 'Loading request...'}
        </Text>
      </View>
    );
  }

  const service = getServiceType(request.type);
  const isEstimateOnly = service.pricingDisplay === 'estimateOnly';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.statusLabel}>{STATE_LABEL[request.state]}</Text>

        {request.priceBreakdown ? (
          <View style={styles.breakdown}>
            {request.priceBreakdown.itemCost > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Item cost</Text>
                <Text style={styles.breakdownValue}>{request.priceBreakdown.itemCost} DA</Text>
              </View>
            )}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                {isEstimateOnly ? 'Estimated call-out' : 'Delivery cost'}
              </Text>
              <Text style={styles.breakdownValue}>{request.priceBreakdown.deliveryCost} DA</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
              <Text style={styles.breakdownTotalLabel}>Total</Text>
              <Text style={styles.price}>
                {isEstimateOnly ? `~${request.price} DA` : `${request.price} DA`}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.price}>{isEstimateOnly ? `~${request.price} DA` : `${request.price} DA`}</Text>
        )}

        {isEstimateOnly && (
          <Text style={styles.estimateNote}>Final price is agreed directly with the provider.</Text>
        )}

        <Text style={styles.meta}>
          {(request.distanceMeters / 1000).toFixed(1)} km · {request.address.city ?? ''}
        </Text>
        {request.providerName && request.state === 'accepted' && (
          <Text style={styles.providerName}>{request.providerName}</Text>
        )}
      </View>

      {request.state === 'pending' && (
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Request</Text>
        </Pressable>
      )}

      {request.state === 'accepted' && request.providerPhone && (
        <Pressable
          style={styles.callButton}
          onPress={() => Linking.openURL(`tel:${request.providerPhone}`)}
        >
          <Text style={styles.callText}>Call Provider</Text>
        </Pressable>
      )}

      {(request.state === 'completed' ||
        request.state === 'declined' ||
        request.state === 'cancelled') && (
        <Pressable style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'center' },
  status: { fontSize: 16, color: colors.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusLabel: { fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center' },
  price: { fontSize: 32, fontWeight: '800', color: colors.primary, marginTop: 16 },
  breakdown: { width: '100%', marginTop: 16 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: 13, color: colors.textMuted },
  breakdownValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  breakdownTotalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 6, paddingTop: 10 },
  breakdownTotalLabel: { fontSize: 14, color: colors.text, fontWeight: '700' },
  estimateNote: { fontSize: 11, color: colors.warning, marginTop: 8, textAlign: 'center' },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  providerName: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 10 },
  cancelButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.danger },
  cancelText: { color: '#fff', fontWeight: '600' },
  callButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  callText: { color: '#fff', fontWeight: '600' },
  doneButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  doneText: { color: '#fff', fontWeight: '600' },
});
