import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/store/useAuthStore';
import { updateAppUser, signOutUser } from '@/services/auth';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({}: Props) {
  const { appUser, firebaseUid, setAppUser } = useAuthStore();
  const [firstName, setFirstName] = useState(appUser?.firstName ?? '');
  const [lastName, setLastName] = useState(appUser?.lastName ?? '');
  const [phone, setPhone] = useState(appUser?.phone ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!firebaseUid) return;
    setSaving(true);
    await updateAppUser(firebaseUid, { firstName, lastName, phone });
    setAppUser(appUser ? { ...appUser, firstName, lastName, phone } : appUser);
    setSaving(false);
    Alert.alert('Saved', 'Your profile has been updated.');
  }

  return (
    <View style={styles.container}>
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
