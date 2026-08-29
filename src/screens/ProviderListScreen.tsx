import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useRequestStore } from '@/store/useRequestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { subscribeToNearbyProviders } from '@/services/providers';
import { createRequest } from '@/services/requests';
import { sendPushNotification } from '@/services/push';
import { getServiceType } from '@/config/serviceTypes';
import { calculatePrice } from '@/utils/pricing';
import { Provider } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import LoadingOverlay from '@/components/LoadingOverlay';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ProviderList'>;

// This ONE screen replaces list_mechanics / list_garage / list_taxis /
// list_tows / list_ambulance / list_stations. It just reads whichever
// service type the user picked from the shared request-flow store.
export default function ProviderListScreen({ navigation }: Props) {
  const { serviceType, location, address, setActiveRequestId } = useRequestStore();
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const appUser = useAuthStore((s) => s.appUser);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const service = serviceType ? getServiceType(serviceType) : null;

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

  async function handleSelectProvider(provider: Provider) {
    if (!serviceType || !location || !address || !firebaseUid || !service) return;
    setSending(true);
    const distanceMeters = provider.distanceMeters ?? 0;
    const price = calculatePrice(distanceMeters, service.pricing);

    const requestId = await createRequest({
      clientId: firebaseUid,
      clientName: `${appUser?.firstName ?? ''} ${appUser?.lastName ?? ''}`.trim(),
      clientPhone: appUser?.phone ?? '',
      clientPushToken: appUser?.pushToken ?? '',
      providerId: provider.id,
      providerPhone: provider.phone,
      providerName: provider.name,
      type: serviceType,
      state: 'pending',
      clientLocation: location,
      providerLocation: provider.location,
      address,
      price,
      distanceMeters,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Best-effort - the request itself already went through above regardless
    sendPushNotification(
      provider.pushToken,
      'New request',
      `${service.icon} ${service.label} request nearby - ${price} DA`,
      { requestId }
    );

    setActiveRequestId(requestId);
    setSending(false);
    navigation.navigate('RequestStatus', { requestId });
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
      </View>

      {!loading && providers.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No {service?.label.toLowerCase()} available nearby right now.</Text>
        </View>
      )}

      <FlatList
        data={providers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProviderCard
            provider={item}
            price={calculatePrice(item.distanceMeters ?? 0, service!.pricing)}
            onPress={() => handleSelectProvider(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  list: { padding: 20, paddingTop: 8 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 14 },
});
