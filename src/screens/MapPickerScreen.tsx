import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useRequestStore } from '@/store/useRequestStore';
import { getCurrentLocation, reverseGeocode, requestLocationPermission } from '@/services/geo';
import { GeoPoint } from '@/types';
import OsmMap from '@/components/Map/OsmMap';
import LoadingOverlay from '@/components/LoadingOverlay';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPicker'>;

const FALLBACK_CENTER: GeoPoint = { lat: 35.4, lng: 8.12 }; // Tébessa, DZ

export default function MapPickerScreen({ navigation }: Props) {
  const setLocation = useRequestStore((s) => s.setLocation);
  const [selected, setSelected] = useState<GeoPoint | null>(null);
  const [center, setCenter] = useState<GeoPoint>(FALLBACK_CENTER);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    (async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        try {
          const loc = await getCurrentLocation();
          setCenter(loc);
          setSelected(loc);
        } catch {
          // keep fallback center
        }
      }
      setLoading(false);
    })();
  }, []);

  async function handleConfirm() {
    if (!selected) return;
    setConfirming(true);
    const address = await reverseGeocode(selected);
    setLocation(selected, address);
    setConfirming(false);
    navigation.navigate('ProviderList');
  }

  return (
    <View style={styles.container}>
      {(loading || confirming) && (
        <LoadingOverlay label={loading ? 'Finding your location...' : 'Getting address...'} />
      )}
      <OsmMap center={center} marker={selected ?? undefined} onMapPress={setSelected} />
      <View style={styles.footer}>
        <Text style={styles.hint}>Tap the map to drop a pin, or use your current location.</Text>
        <Pressable
          style={[styles.button, !selected && styles.buttonDisabled]}
          disabled={!selected}
          onPress={handleConfirm}
        >
          <Text style={styles.buttonText}>Confirm Location</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  footer: {
    padding: 18,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: 10, textAlign: 'center' },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
