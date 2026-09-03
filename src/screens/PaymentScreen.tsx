import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { subscribeToRequest, payForRequest } from '@/services/requests';
import { getProviderPushToken, sendPushNotification } from '@/services/push';
import { PaymentMethod, ServiceRequest } from '@/types';
import { useT } from '@/store/useLocaleStore';
import { colors } from '@/constants/colors';
import LoadingOverlay from '@/components/LoadingOverlay';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

/**
 * Mock "pay now" flow. No gateway is wired up yet (see docs Section 8.2) -
 * choosing any non-cash method reveals a card-details form (number/expiry/
 * CVV/name). Submitting it just simulates a short processing delay and then
 * a successful charge, so the rest of the app (request record, provider
 * history) already behaves as if payment collection exists. Swapping in
 * a real processor later is a change to handlePay() only; nothing else
 * downstream needs to know the difference. The form fields themselves are
 * never sent anywhere - they only gate the simulated "success".
 *
 * Methods shown cover both markets the app serves: 'card' (generic Visa/
 * Mastercard) works everywhere; 'edahabia' (Algérie Poste / CIB) is the
 * common local rail in Algeria; 'mada' and 'stcpay' are the common local
 * rails in Saudi Arabia. All four share the same simulated card form for
 * now - only the label/icon differs - since none of them are wired to a
 * real processor yet.
 */
const CARD_LIKE_METHODS: PaymentMethod[] = ['card', 'edahabia', 'mada', 'stcpay'];
export default function PaymentScreen({ route, navigation }: Props) {
  const t = useT();
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [processing, setProcessing] = useState(false);

  // Card form state - local only, never persisted or transmitted.
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    const unsub = subscribeToRequest(requestId, setRequest);
    return unsub;
  }, [requestId]);

  // Already paid (e.g. came back to this screen after it succeeded, or
  // paid from another device) - nothing left to do here.
  useEffect(() => {
    if (request?.paymentStatus === 'paid') {
      navigation.goBack();
    }
  }, [request?.paymentStatus]);

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  // Real validation, not just "two digits slash two digits": month must be
  // 01-12, and the card must not already be expired.
  function isExpiryValid(value: string): boolean {
    const match = /^(\d{2})\/(\d{2})$/.exec(value);
    if (!match) return false;
    const month = parseInt(match[1], 10);
    const year = parseInt(match[2], 10) + 2000;
    if (month < 1 || month > 12) return false;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    return true;
  }

  // Card-like methods share one form; cash needs none of it. This also
  // gates the local-rail options (edahabia/mada/stcpay) below, so they
  // only appear once "card" has been chosen instead of always being
  // visible regardless of the selected method.
  const showCardForm = CARD_LIKE_METHODS.includes(method);

  const isCardFormValid =
    cardNumber.replace(/\D/g, '').length === 16 &&
    isExpiryValid(expiry) &&
    cvv.length >= 3 &&
    cardName.trim().length > 0;

  const canPay = method === 'cash' || isCardFormValid;

  async function handlePay() {
    setProcessing(true);
    try {
      if (showCardForm) {
        // Simulated processing delay only - no real card network call.
        await new Promise((resolve) => setTimeout(resolve, 1400));
      }

      // Must fetch BEFORE payForRequest() - that call deletes the
      // activeClients mirror doc (in the same transaction that marks the
      // request paid) that grants this client read access to the
      // provider's private/contact doc. Fetching after would hit
      // permission-denied since the grant is already gone by then.
      const providerToken = request.providerId
        ? await getProviderPushToken(request.providerId).catch(() => undefined)
        : undefined;

      await payForRequest(requestId, method);

      // Best-effort - payment itself already went through above regardless.
      sendPushNotification(
        providerToken,
        t('payment.pushPaidTitle'),
        t('payment.pushPaidBody', { name: request.clientName || t('worker.client') }),
        { requestId }
      );

      Alert.alert(t('payment.successTitle'), t('payment.successMessage'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert(t('payment.couldNotPayTitle'), e?.message ?? t('common.checkConnectionRetry'));
    } finally {
      setProcessing(false);
    }
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loadingRequest')}</Text>
      </View>
    );
  }

  const currency = t('common.currency');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('payment.amountDue')}</Text>
          <Text style={styles.amount}>{request.price} {currency}</Text>
        </View>

        <Text style={styles.sectionLabel}>{t('payment.chooseMethod')}</Text>

        <Pressable
          style={[styles.methodCard, method === 'cash' && styles.methodCardSelected]}
          onPress={() => setMethod('cash')}
        >
          <Text style={styles.methodIcon}>💵</Text>
          <View style={styles.methodTextWrap}>
            <Text style={styles.methodLabel}>{t('payment.cash')}</Text>
            <Text style={styles.methodHint}>{t('payment.cashHint')}</Text>
          </View>
          {method === 'cash' && <Text style={styles.check}>✓</Text>}
        </Pressable>

        <Pressable
          style={[styles.methodCard, method === 'card' && styles.methodCardSelected]}
          onPress={() => setMethod('card')}
        >
          <Text style={styles.methodIcon}>💳</Text>
          <View style={styles.methodTextWrap}>
            <Text style={styles.methodLabel}>{t('payment.card')}</Text>
            <Text style={styles.methodHint}>{t('payment.cardHint')}</Text>
          </View>
          {method === 'card' && <Text style={styles.check}>✓</Text>}
        </Pressable>

        {showCardForm && (
          <>
            <Text style={styles.sectionLabel}>{t('payment.localMethods')}</Text>

            <Pressable
              style={[styles.methodCard, method === 'edahabia' && styles.methodCardSelected]}
              onPress={() => setMethod('edahabia')}
            >
              <Text style={styles.methodIcon}>🇩🇿</Text>
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodLabel}>{t('payment.edahabia')}</Text>
                <Text style={styles.methodHint}>{t('payment.edahabiaHint')}</Text>
              </View>
              {method === 'edahabia' && <Text style={styles.check}>✓</Text>}
            </Pressable>

            <Pressable
              style={[styles.methodCard, method === 'mada' && styles.methodCardSelected]}
              onPress={() => setMethod('mada')}
            >
              <Text style={styles.methodIcon}>🇸🇦</Text>
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodLabel}>{t('payment.mada')}</Text>
                <Text style={styles.methodHint}>{t('payment.madaHint')}</Text>
              </View>
              {method === 'mada' && <Text style={styles.check}>✓</Text>}
            </Pressable>

            <Pressable
              style={[styles.methodCard, method === 'stcpay' && styles.methodCardSelected]}
              onPress={() => setMethod('stcpay')}
            >
              <Text style={styles.methodIcon}>📱</Text>
              <View style={styles.methodTextWrap}>
                <Text style={styles.methodLabel}>{t('payment.stcpay')}</Text>
                <Text style={styles.methodHint}>{t('payment.stcpayHint')}</Text>
              </View>
              {method === 'stcpay' && <Text style={styles.check}>✓</Text>}
            </Pressable>
          </>
        )}

        {showCardForm && (
          <View style={styles.cardForm}>
            <Text style={styles.cardFormTitle}>{t('payment.cardDetails')}</Text>

            <Text style={styles.fieldLabel}>{t('payment.cardNumber')}</Text>
            <TextInput
              style={styles.input}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              maxLength={19}
            />

            <View style={styles.row}>
              <View style={styles.rowItemFlex}>
                <Text style={styles.fieldLabel}>{t('payment.expiry')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={expiry}
                  onChangeText={(v) => setExpiry(formatExpiry(v))}
                  maxLength={5}
                />
              </View>
              <View style={styles.rowSpacer} />
              <View style={styles.rowItemFlex}>
                <Text style={styles.fieldLabel}>{t('payment.cvv')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  secureTextEntry
                  value={cvv}
                  onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('payment.cardholderName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('payment.cardholderNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              value={cardName}
              onChangeText={setCardName}
            />

            <Text style={styles.cardFormNote}>{t('payment.cardFormNote')}</Text>
          </View>
        )}

        <Pressable
          style={[styles.payButton, !canPay && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={processing || !canPay}
        >
          <Text style={styles.payText}>
            {method === 'cash' ? t('payment.confirmCash') : t('payment.payNow')}
          </Text>
        </Pressable>
      </ScrollView>

      {processing && (
        <LoadingOverlay label={showCardForm ? t('payment.processing') : undefined} />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 20 },
  loadingText: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 40 },
  amountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  amountLabel: { fontSize: 13, color: colors.textMuted },
  amount: { fontSize: 32, fontWeight: '800', color: colors.primary, marginTop: 6 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 10 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodCardSelected: { borderColor: colors.accent, borderWidth: 2 },
  methodIcon: { fontSize: 26, marginRight: 14 },
  methodTextWrap: { flex: 1 },
  methodLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  methodHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  check: { fontSize: 18, fontWeight: '700', color: colors.accent },
  cardForm: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFormTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
    color: colors.text,
  },
  row: { flexDirection: 'row' },
  rowItemFlex: { flex: 1 },
  rowSpacer: { width: 12 },
  cardFormNote: { fontSize: 11, color: colors.textMuted, marginTop: -4 },
  payButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  payButtonDisabled: { opacity: 0.5 },
  payText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});