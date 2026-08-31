import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useRequestStore } from '@/store/useRequestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { subscribeToNearbyProviders } from '@/services/providers';
import { createRequest } from '@/services/requests';
import { sendPushNotification } from '@/services/push';
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
  const { serviceType, location, address, extra, setActiveRequestId } = useRequestStore();
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const appUser = useAuthStore((s) => s.appUser);
  const { isOffline } = useNetworkStatus();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const service = serviceType ? getServiceType(serviceType) : null;
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
      Alert.alert("You're offline", 'Reconnect to send this request.');
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

      // Best-effort - the request itself already went through above regardless
      sendPushNotification(
        provider.pushToken,
        'New request',
        `${service.icon} ${service.label} request nearby${isEstimateOnly ? '' : ` - ${total} DA`}`,
        { requestId }
      );

      setActiveRequestId(requestId);
      navigation.navigate('RequestStatus', { requestId });
    } catch (e) {
      Alert.alert('Could not send request', 'Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      {(loading || sending) && (
        <LoadingOverlay label={sending ? 'Sending your request...' : 'Looking for providers...'} />
      )}
      <View style={styles.header}>
        <Text style={styles.title}>
          {service?.icon} {service?.label} near you
        </Text>
        <Text style={styles.subtitle}>{address?.city ?? 'Your area'}</Text>
        {isEstimateOnly && (
          <Text style={styles.estimateNote}>
            Prices below are a rough call-out estimate - the {service?.label.toLowerCase()} will
            confirm the final cost with you once they see the issue.
          </Text>
        )}
      </View>

      {!loading && isOffline && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            You're offline - can't search for providers right now. Reconnect and this screen will
            update automatically.
          </Text>
        </View>
      )}

      {!loading && !isOffline && providers.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No {service?.label.toLowerCase()} available nearby right now.</Text>
        </View>
      )}

      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const { total } = calculateFullPrice(service!, item.distanceMeters ?? 0, extra);
          return (
            <ProviderCard
              provider={item}
              price={total}
              priceLabel={isEstimateOnly ? `~${total} DA est.` : `${total} DA`}
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
