import React, { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { subscribeToRequest, cancelRequest } from '@/services/requests';
import { ServiceRequest } from '@/types';
import { useRequestStore } from '@/store/useRequestStore';
import { useT } from '@/store/useLocaleStore';
import { getServiceType } from '@/config/serviceTypes';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestStatus'>;

export default function RequestStatusScreen({ route, navigation }: Props) {
  const t = useT();
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const resetFlow = useRequestStore((s) => s.reset);
  const startFollowUp = useRequestStore((s) => s.startFollowUp);
  const setLocation = useRequestStore((s) => s.setLocation);
  const hasPromptedFollowUp = useRef(false);
  const { isOffline } = useNetworkStatus();

  const STATE_LABEL: Record<ServiceRequest['state'], string> = {
    pending: t('requestStatus.pending'),
    accepted: t('requestStatus.accepted'),
    declined: t('requestStatus.declined'),
    completed: t('requestStatus.completed'),
    cancelled: t('requestStatus.cancelled'),
  };

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
        t('requestStatus.followUpAmbulanceTitle'),
        t('requestStatus.followUpAmbulanceMessage'),
        [
          { text: t('common.notNow'), style: 'cancel' },
          { text: t('requestStatus.requestTaxi'), onPress: () => startFollowUpRequest('taxi') },
        ]
      );
    } else if (request.type === 'taxi') {
      Alert.alert(
        t('requestStatus.followUpTaxiTitle'),
        t('requestStatus.followUpTaxiMessage'),
        [
          { text: t('common.notNow'), style: 'cancel' },
          { text: t('requestStatus.requestAmbulance'), onPress: () => startFollowUpRequest('ambulance') },
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
    Alert.alert(t('requestStatus.cancelConfirmTitle'), t('requestStatus.cancelConfirmMessage'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('requestStatus.yesCancel'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRequest(requestId);
            resetFlow();
            navigation.navigate('ServiceSelect');
          } catch (e: any) {
            // Most likely: the provider already accepted/declined it a
            // moment before this tap landed - the live listener above
            // already shows the real current state, so just surface why
            // the cancel didn't go through instead of pretending it did.
            Alert.alert(t('requestStatus.couldNotCancelTitle'), e?.message ?? t('common.checkConnectionRetry'));
          }
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
          {isOffline ? t('requestStatus.offlineLoading') : t('common.loadingRequest')}
        </Text>
      </View>
    );
  }

  const service = getServiceType(request.type);
  const isEstimateOnly = service.pricingDisplay === 'estimateOnly';
  const currency = t('common.currency');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.statusLabel}>{STATE_LABEL[request.state]}</Text>

        {request.priceBreakdown ? (
          <View style={styles.breakdown}>
            {request.priceBreakdown.itemCost > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('requestStatus.itemCost')}</Text>
                <Text style={styles.breakdownValue}>{request.priceBreakdown.itemCost} {currency}</Text>
              </View>
            )}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>
                {isEstimateOnly ? t('requestStatus.estimatedCallOut') : t('requestStatus.deliveryCost')}
              </Text>
              <Text style={styles.breakdownValue}>{request.priceBreakdown.deliveryCost} {currency}</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
              <Text style={styles.breakdownTotalLabel}>{t('common.total')}</Text>
              <Text style={styles.price}>
                {isEstimateOnly ? `~${request.price} ${currency}` : `${request.price} ${currency}`}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.price}>{isEstimateOnly ? `~${request.price} ${currency}` : `${request.price} ${currency}`}</Text>
        )}

        {isEstimateOnly && (
          <Text style={styles.estimateNote}>{t('requestStatus.finalPriceNote')}</Text>
        )}

        <Text style={styles.meta}>
          {(request.distanceMeters / 1000).toFixed(1)} km · {request.address.city ?? ''}
        </Text>
        {request.providerName && request.state === 'accepted' && (
          <Text style={styles.providerName}>{request.providerName}</Text>
        )}
        {request.state === 'completed' && request.paymentStatus === 'paid' && (
          <Text style={styles.paidBadge}>
            {t('requestStatus.paid', {
              method: t(`payment.${request.paymentMethod ?? 'cash'}`),
            })}
          </Text>
        )}
      </View>

      {request.state === 'completed' && request.paymentStatus !== 'paid' && (
        <Pressable
          style={styles.payButton}
          onPress={() => navigation.navigate('Payment', { requestId })}
        >
          <Text style={styles.payText}>{t('requestStatus.payNowButton')}</Text>
        </Pressable>
      )}

      {request.state === 'pending' && (
        <Pressable style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>{t('requestStatus.cancelRequestButton')}</Text>
        </Pressable>
      )}

      {request.state === 'accepted' && request.providerPhone && (
        <Pressable
          style={styles.callButton}
          onPress={() => Linking.openURL(`tel:${request.providerPhone}`)}
        >
          <Text style={styles.callText}>{t('requestStatus.callProviderButton')}</Text>
        </Pressable>
      )}

      {(request.state === 'completed' ||
        request.state === 'declined' ||
        request.state === 'cancelled') && (
        <Pressable style={styles.doneButton} onPress={handleDone}>
          <Text style={styles.doneText}>{t('common.done')}</Text>
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
  paidBadge: { fontSize: 12, fontWeight: '700', color: colors.success, marginTop: 10 },
  payButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.accent },
  payText: { color: colors.navy900, fontWeight: '700' },
  cancelButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.danger },
  cancelText: { color: '#fff', fontWeight: '600' },
  callButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  callText: { color: '#fff', fontWeight: '600' },
  doneButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  doneText: { color: '#fff', fontWeight: '600' },
});
