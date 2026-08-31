import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/useAuthStore';
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
  const { appUser, firebaseUid, setAppUser } = useAuthStore();
  const [firstName, setFirstName] = useState(appUser?.firstName ?? '');
  const [lastName, setLastName] = useState(appUser?.lastName ?? '');
  const [phone, setPhone] = useState(appUser?.phone ?? '');
  const [nationalId, setNationalId] = useState(() => decryptNationalId(appUser?.nationalId));
  const [vehicles, setVehicles] = useState<SavedVehicle[]>(appUser?.vehicles ?? []);
  const [newVehicleType, setNewVehicleType] = useState<string | undefined>(undefined);
  const [newVehicleMakeModel, setNewVehicleMakeModel] = useState('');
  const [saving, setSaving] = useState(false);

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
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Could not save', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.label}>First name</Text>
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

      <Text style={styles.label}>Last name</Text>
      <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="+213..."
      />

      <Text style={styles.label}>National ID</Text>
      <TextInput
        style={styles.input}
        value={nationalId}
        onChangeText={setNationalId}
        keyboardType="number-pad"
      />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Vehicles</Text>
        <Text style={styles.sectionHint}>{vehicles.length}/{MAX_VEHICLES}</Text>
      </View>
      <Text style={styles.sectionSubtext}>
        Saved vehicles auto-fill on mechanic, tow, and garage requests - still editable per request.
      </Text>

      {vehicles.map((v) => {
        const typeLabel = VEHICLE_TYPE_OPTIONS.find((o) => o.value === v.vehicleType)?.label ?? '';
        return (
          <View key={v.id} style={styles.vehicleRow}>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleMakeModel}>{v.makeModel}</Text>
              <Text style={styles.vehicleType}>{typeLabel}</Text>
            </View>
            <Pressable onPress={() => handleRemoveVehicle(v.id)} hitSlop={10}>
              <Text style={styles.removeVehicle}>Remove</Text>
            </Pressable>
          </View>
        );
      })}

      {vehicles.length < MAX_VEHICLES && (
        <View style={styles.addVehicleWrap}>
          <SelectDropdown
            label="Vehicle type"
            value={newVehicleType}
            options={VEHICLE_TYPE_OPTIONS}
            onChange={setNewVehicleType}
          />
          <Text style={styles.label}>Make & model</Text>
          <TextInput
            style={styles.input}
            value={newVehicleMakeModel}
            onChangeText={setNewVehicleMakeModel}
            placeholder="e.g. Renault Symbol"
          />
          <Pressable
            style={[
              styles.addVehicleButton,
              (!newVehicleType || !newVehicleMakeModel.trim()) && styles.buttonDisabled,
            ]}
            disabled={!newVehicleType || !newVehicleMakeModel.trim()}
            onPress={handleAddVehicle}
          >
            <Text style={styles.addVehicleText}>+ Add Vehicle</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.emailLabel}>{appUser?.email}</Text>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={() => signOutUser()}>
        <Text style={styles.signOutText}>Sign Out</Text>
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
