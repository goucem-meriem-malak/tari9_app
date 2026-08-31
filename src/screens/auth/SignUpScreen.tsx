import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { signUp } from '@/services/auth';
import { colors } from '@/constants/colors';
import LoadingOverlay from '@/components/LoadingOverlay';
import { UserRole } from '@/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const [role, setRole] = useState<UserRole>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    firstName && lastName && email && password.length >= 6 && nationalId.trim().length > 0;

  async function handleSignUp() {
    setError(null);
    setLoading(true);
    try {
      await signUp(
        email.trim(),
        password,
        firstName.trim(),
        lastName.trim(),
        role,
        nationalId.trim()
      );
      // RootNavigator picks the right stack once appUser.role loads
    } catch (e: any) {
      setError(
        e?.code === 'auth/email-already-in-use'
          ? 'That email is already registered.'
          : 'Could not create your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {loading && <LoadingOverlay label="Creating your account..." />}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Get roadside help, or offer it</Text>

        <View style={styles.roleToggle}>
          <Pressable
            style={[styles.roleOption, role === 'client' && styles.roleOptionActive]}
            onPress={() => setRole('client')}
          >
            <Text style={[styles.roleText, role === 'client' && styles.roleTextActive]}>
              I need help
            </Text>
          </Pressable>
          <Pressable
            style={[styles.roleOption, role === 'worker' && styles.roleOptionActive]}
            onPress={() => setRole('worker')}
          >
            <Text style={[styles.roleText, role === 'worker' && styles.roleTextActive]}>
              I provide a service
            </Text>
          </Pressable>
        </View>

        <TextInput style={styles.input} placeholder="First name" value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Last name" value={lastName} onChangeText={setLastName} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="National ID number"
          keyboardType="number-pad"
          value={nationalId}
          onChangeText={setNationalId}
        />
        <Text style={styles.idHint}>
          Used to verify your identity in case of a scam report. It's encrypted before it ever
          leaves your device.
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          disabled={!canSubmit}
          onPress={handleSignUp}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 20 },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 20,
  },
  roleOption: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  roleOptionActive: { backgroundColor: colors.primary },
  roleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  roleTextActive: { color: '#fff' },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { textAlign: 'center', color: colors.primary, marginTop: 18, fontSize: 13 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 8 },
  idHint: { fontSize: 11, color: colors.textMuted, marginTop: -6, marginBottom: 12 },
});
