import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { updateProviderProfile } from '@/services/providerProfile';
import { signOutUser } from '@/services/auth';
import { colors } from '@/constants/colors';
import { getServiceType } from '@/config/serviceTypes';

export default function WorkerProfileScreen() {
  const { providerProfile, setProviderProfile, appUser } = useAuthStore();
  const [name, setName] = useState(providerProfile?.name ?? '');
  const [phone, setPhone] = useState(providerProfile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  if (!providerProfile) return null;
  const service = getServiceType(providerProfile.type);

  async function handleSave() {
    if (!providerProfile) return;
    setSaving(true);
    await updateProviderProfile(providerProfile.id, { name, phone });
    setProviderProfile({ ...providerProfile, name, phone });
    setSaving(false);
    Alert.alert('Saved', 'Your provider profile has been updated.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.serviceBadge}>
        {service.icon} {service.label}
      </Text>

      <Text style={styles.label}>Business / display name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Contact phone</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.emailLabel}>{appUser?.email}</Text>

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={() => signOutUser()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  serviceBadge: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 10 },
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
});
