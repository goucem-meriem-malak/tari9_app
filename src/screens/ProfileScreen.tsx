import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/store/useLocaleStore';
import { updateAppUser, signOutUser } from '@/services/auth';
import { colors } from '@/constants/colors';
import { encryptNationalId, decryptNationalId } from '@/utils/idCrypto';
import { VEHICLE_TYPE_OPTIONS } from '@/config/serviceTypes';
import { SavedVehicle } from '@/types';
import SelectDropdown from '@/components/SelectDropdown';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const MAX_VEHICLES = 3;

function makeVehicleId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export default function ProfileScreen({}: Props) {
  const t = useT();
  const { appUser, firebaseUid, setAppUser } = useAuthStore();
  const [firstName, setFirstName] = useState(appUser?.firstName ?? '');
  const [lastName, setLastName] = useState(appUser?.lastName ?? '');
  const [phone, setPhone] = useState(appUser?.phone ?? '');
  const [nationalId, setNationalId] = useState(() => decryptNationalId(appUser?.nationalId));
  const [vehicles, setVehicles] = useState<SavedVehicle[]>(appUser?.vehicles ?? []);
  const [newVehicleType, setNewVehicleType] = useState<string | undefined>(undefined);
  const [newVehicleMakeModel, setNewVehicleMakeModel] = useState('');
  const [saving, setSaving] = useState(false);

  // Translated options for the vehicle-type dropdown - same value list as
  // config/serviceTypes.ts, labels looked up in fieldOptions so they stay
  // in sync with the request-details form instead of a second copy.
  const vehicleTypeOptions = VEHICLE_TYPE_OPTIONS.map((o) => ({
    value: o.value,
    label: t(`fieldOptions.${o.value}`),
  }));

  function vehicleTypeLabel(value: string): string {
    return t(`fieldOptions.${value}`);
  }

  function handleAddVehicle() {
    if (!newVehicleType || !newVehicleMakeModel.trim() || vehicles.length >= MAX_VEHICLES) return;
    setVehicles((prev) => [
      ...prev,
      { id: makeVehicleId(), vehicleType: newVehicleType, makeModel: newVehicleMakeModel.trim() },
    ]);
    setNewVehicleType(undefined);
    setNewVehicleMakeModel('');
  }

  function handleRemoveVehicle(id: string) {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }

  async function handleSave() {
    if (!firebaseUid) return;
    setSaving(true);
    try {
      const encryptedId = encryptNationalId(nationalId);
      await updateAppUser(firebaseUid, { firstName, lastName, phone, nationalId: encryptedId, vehicles });
      setAppUser(
        appUser ? { ...appUser, firstName, lastName, phone, nationalId: encryptedId, vehicles } : appUser
      );
      Alert.alert(t('common.savedTitle'), t('profile.savedMessage'));
    } catch (e) {
      Alert.alert(t('common.couldNotSaveTitle'), t('common.checkConnectionRetry'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.label}>{t('auth.firstName')}</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

      <Text style={styles.label}>{t('auth.lastName')}</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

      <Text style={styles.label}>{t('profile.phone')}</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder={t('common.phonePlaceholder')}
      />

      <Text style={styles.label}>{t('profile.nationalId')}</Text>
      <TextInput
        style={styles.input}
        value={nationalId}
        onChangeText={setNationalId}
        keyboardType="number-pad"
      />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{t('profile.myVehicles')}</Text>
        <Text style={styles.sectionHint}>{vehicles.length}/{MAX_VEHICLES}</Text>
      </View>
      <Text style={styles.sectionSubtext}>{t('profile.vehiclesSubtext')}</Text>

      {vehicles.map((v) => {
        const typeLabel = vehicleTypeLabel(v.vehicleType);
        return (
          <View key={v.id} style={styles.vehicleRow}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleMakeModel}>{v.makeModel}</Text>
              <Text style={styles.vehicleType}>{typeLabel}</Text>
            </View>
            <Pressable onPress={() => handleRemoveVehicle(v.id)} hitSlop={10}>
              <Text style={styles.removeVehicle}>{t('common.remove')}</Text>
            </Pressable>
          </View>
        );
      })}

      {vehicles.length < MAX_VEHICLES && (
        <View style={styles.addVehicleWrap}>
          <SelectDropdown
            label={t('serviceFields.vehicleType.label')}
            value={newVehicleType}
            options={vehicleTypeOptions}
            onChange={setNewVehicleType}
          />
          <Text style={styles.label}>{t('serviceFields.vehicleMakeModel.label')}</Text>
          <TextInput
            style={styles.input}
            value={newVehicleMakeModel}
            onChangeText={setNewVehicleMakeModel}
            placeholder={t('serviceFields.vehicleMakeModel.placeholder')}
          />
          <Pressable
            style={[
              styles.addVehicleButton,
              (!newVehicleType || !newVehicleMakeModel.trim()) && styles.buttonDisabled,
            ]}
            disabled={!newVehicleType || !newVehicleMakeModel.trim()}
            onPress={handleAddVehicle}
          >
            <Text style={styles.addVehicleText}>{t('profile.addVehicle')}</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.emailLabel}>{appUser?.email}</Text>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? t('common.saving') : t('common.saveChanges')}</Text>
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={() => signOutUser()}>
        <Text style={styles.signOutText}>{t('common.signOut')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, color: colors.textMuted, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
  },
  emailLabel: { fontSize: 12, color: colors.textMuted, marginTop: 20 },
  saveButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 24 },
  saveText: { color: '#fff', fontWeight: '600' },
  signOutButton: { padding: 15, alignItems: 'center', marginTop: 12 },
  signOutText: { color: colors.danger, fontWeight: '600' },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 26,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: 12, color: colors.textMuted },
  sectionSubtext: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: 12 },

  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    marginBottom: 8,
  },
  vehicleInfo: { flex: 1 },
  vehicleMakeModel: { fontSize: 14, fontWeight: '600', color: colors.text },
  vehicleType: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  removeVehicle: { fontSize: 12, color: colors.danger, fontWeight: '600' },

  addVehicleWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    marginTop: 4,
    backgroundColor: colors.background,
  },
  addVehicleButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  addVehicleText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  buttonDisabled: { opacity: 0.5 },
});
