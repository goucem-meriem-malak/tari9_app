import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { SERVICE_TYPES, ServiceTypeId } from '@/config/serviceTypes';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/store/useLocaleStore';
import { createProviderProfile } from '@/services/providerProfile';
import { getCurrentLocation, reverseGeocode, requestLocationPermission } from '@/services/geo';
import { colors } from '@/constants/colors';
import LoadingOverlay from '@/components/LoadingOverlay';

// Shown once, right after a worker signs up - collects what the original
// app split across list_mechanics/list_garage/etc "become a provider" forms,
// but as one flow driven by the same SERVICE_TYPES config the client uses.
export default function WorkerOnboardingScreen() {
  const t = useT();
  const { firebaseUid, appUser, setProviderProfile } = useAuthStore();
  const [type, setType] = useState<ServiceTypeId | null>(null);
  const [businessName, setBusinessName] = useState(
    appUser ? `${appUser.firstName} ${appUser.lastName}` : ''
  );
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = type && businessName.trim() && phone.trim();

  async function handleSubmit() {
    if (!firebaseUid || !type) return;
    setError(null);
    setLoading(true);
    try {
      const granted = await requestLocationPermission();
      if (!granted) {
        setError(t('workerOnboarding.locationPermissionError'));
        setLoading(false);
        return;
      }
      const location = await getCurrentLocation();
      const address = await reverseGeocode(location);

      const provider = await createProviderProfile(firebaseUid, {
        type,
        name: businessName.trim(),
        phone: phone.trim(),
        location,
        address,
      });
      setProviderProfile(provider);
    } catch (e) {
      setError(t('workerOnboarding.createError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loading && <LoadingOverlay label={t('workerOnboarding.settingUp')} />}
      <Text style={styles.title}>{t('workerOnboarding.title')}</Text>
      <Text style={styles.subtitle}>{t('workerOnboarding.subtitle')}</Text>

      <View style={styles.grid}>
        {SERVICE_TYPES.map((s) => (
          <Pressable
            key={s.id}
            style={[styles.typeChip, type === s.id && styles.typeChipActive]}
            onPress={() => setType(s.id)}
          >
            <Text style={styles.typeIcon}>{s.icon}</Text>
            <Text style={[styles.typeLabel, type === s.id && styles.typeLabelActive]}>
              {t(`services.${s.id}.label`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t('workerOnboarding.businessName')}</Text>
      <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} />

      <Text style={styles.label}>{t('workerOnboarding.contactPhone')}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder={t('common.phonePlaceholder')}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>{t('workerOnboarding.submitButton')}</Text>
      </Pressable>
      <Text style={styles.hint}>{t('workerOnboarding.locationHint')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeChip: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  typeIcon: { fontSize: 24, marginBottom: 4 },
  typeLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  typeLabelActive: { color: colors.primary, fontWeight: '700' },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6, marginTop: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    marginBottom: 8,
  },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  hint: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 12 },
  error: { color: colors.danger, fontSize: 13, marginTop: 8 },
});
