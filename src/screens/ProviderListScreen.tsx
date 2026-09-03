import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useRequestStore } from '@/store/useRequestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/store/useLocaleStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { subscribeToNearbyProviders } from '@/services/providers';
import { createRequest } from '@/services/requests';
import { sendPushNotification, getProviderPushToken } from '@/services/push';
import { getServiceType } from '@/config/serviceTypes';
import { calculateFullPrice } from '@/utils/pricing';
import { Provider } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import LoadingOverlay from '@/components/LoadingOverlay';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderList'>;

// This ONE screen replaces list_mechanics / list_garage / list_taxis /
// list_tows / list_ambulance / list_stations. It just reads whichever
// service type the user picked from the shared request-flow store.
export default function ProviderListScreen({ navigation }: Props) {
  const t = useT();
  const { serviceType, location, address, extra, setActiveRequestId } = useRequestStore();
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const appUser = useAuthStore((s) => s.appUser);
  const { isOffline } = useNetworkStatus();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const service = serviceType ? getServiceType(serviceType) : null;
  const serviceLabel = serviceType ? t(`services.${serviceType}.label`) : '';
  const isEstimateOnly = service?.pricingDisplay === 'estimateOnly';

  useEffect(() => {
    if (!serviceType || !location) return;
    const unsub = subscribeToNearbyProviders(
      serviceType,
      location,
      (list) => {
        setProviders(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [serviceType, location]);

  // Firestore's listener has no way to tell us "we're offline" on its own -
  // it just sits pending until reconnect, which used to leave this screen
  // spinning forever with no explanation. As soon as NetInfo confirms we're
  // offline, stop waiting on it and show the real reason instead.
  useEffect(() => {
    if (isOffline && loading) setLoading(false);
  }, [isOffline, loading]);

  async function handleSelectProvider(provider: Provider) {
    if (!serviceType || !location || !address || !firebaseUid || !service) return;
    if (isOffline) {
      Alert.alert(t('common.youAreOfflineTitle'), t('providerList.reconnectToSend'));
      return;
    }
    setSending(true);
    try {
      const distanceMeters = provider.distanceMeters ?? 0;
      const { itemCost, deliveryCost, total } = calculateFullPrice(service, distanceMeters, extra);

      const requestId = await createRequest({
        clientId: firebaseUid,
        clientName: `${appUser?.firstName ?? ''} ${appUser?.lastName ?? ''}`.trim(),
        clientPhone: appUser?.phone ?? '',
        clientPushToken: appUser?.pushToken ?? '',
        // Never the ID itself - just whether one is on file. See ServiceRequest.clientIdVerified.
        clientIdVerified: !!appUser?.nationalId,
        providerId: provider.id,
        providerPhone: provider.phone,
        providerName: provider.name,
        type: serviceType,
        state: 'pending',
        clientLocation: location,
        providerLocation: provider.location,
        address,
        price: total,
        priceBreakdown: { itemCost, deliveryCost },
        distanceMeters,
        extra,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Best-effort - the request itself already went through above regardless.
      // provider.pushToken no longer exists on the browse-list object (see
      // firestore.rules) - fetch it now that createRequest() above has
      // written the activeClients mirror doc that grants this read.
      // Translated using the client's current locale, since we don't have a
      // per-provider language preference stored yet.
      const providerToken = await getProviderPushToken(provider.id);
      sendPushNotification(
        providerToken,
        t('providerList.newRequestPushTitle'),
        t('providerList.newRequestPushBody', {
          icon: service.icon,
          service: serviceLabel,
          price: isEstimateOnly ? '' : ` - ${total} ${t('common.currency')}`,
        }),
        { requestId }
      );

      setActiveRequestId(requestId);
      navigation.navigate('RequestStatus', { requestId });
    } catch (e) {
      Alert.alert(t('providerList.couldNotSendTitle'), t('common.checkConnectionRetry'));
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      {(loading || sending) && (
        <LoadingOverlay label={sending ? t('providerList.sending') : t('providerList.looking')} />
      )}
      <View style={styles.header}>
        <Text style={styles.title}>
          {service?.icon} {serviceLabel} {t('providerList.nearYou')}
        </Text>
        <Text style={styles.subtitle}>{address?.city ?? t('providerList.yourArea')}</Text>
        {isEstimateOnly && (
          <Text style={styles.estimateNote}>
            {t('providerList.estimateNote', { service: serviceLabel.toLowerCase() })}
          </Text>
        )}
      </View>

      {!loading && isOffline && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('providerList.offlineMessage')}</Text>
        </View>
      )}

      {!loading && !isOffline && providers.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            {t('providerList.noneAvailable', { service: serviceLabel.toLowerCase() })}
          </Text>
        </View>
      )}

      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const { total } = calculateFullPrice(service!, item.distanceMeters ?? 0, extra);
          const currency = t('common.currency');
          return (
            <ProviderCard
              provider={item}
              price={total}
              priceLabel={isEstimateOnly ? `~${total} ${currency} ${t('providerList.estimatedSuffix')}` : `${total} ${currency}`}
              onPress={() => handleSelectProvider(item)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  estimateNote: { fontSize: 11, color: colors.warning, marginTop: 8 },
  list: { padding: 20, paddingTop: 8 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 14 },
});