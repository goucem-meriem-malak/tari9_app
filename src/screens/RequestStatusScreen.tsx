import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { subscribeToRequest, cancelRequest } from '@/services/requests';
import { ServiceRequest } from '@/types';
import { useRequestStore } from '@/store/useRequestStore';
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

  useEffect(() => {
    const unsub = subscribeToRequest(requestId, setRequest);
    return unsub;
  }, [requestId]);

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
        <Text style={styles.status}>Loading request...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.statusLabel}>{STATE_LABEL[request.state]}</Text>
        <Text style={styles.price}>{request.price} DA</Text>
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
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
  providerName: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 10 },
  cancelButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.danger },
  cancelText: { color: '#fff', fontWeight: '600' },
  callButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  callText: { color: '#fff', fontWeight: '600' },
  doneButton: { marginTop: 24, padding: 15, alignItems: 'center', borderRadius: 10, backgroundColor: colors.primary },
  doneText: { color: '#fff', fontWeight: '600' },
});
