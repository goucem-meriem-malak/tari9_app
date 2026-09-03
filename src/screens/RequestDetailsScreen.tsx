import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useRequestStore } from '@/store/useRequestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/store/useLocaleStore';
import { getServiceType, ExtraFieldConfig, VEHICLE_TYPE_OPTIONS } from '@/config/serviceTypes';
import { calculateItemCost } from '@/utils/pricing';
import SelectDropdown from '@/components/SelectDropdown';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RequestDetails'>;

// One screen for every service - it just reads whichever fields the picked
// service declares in config/serviceTypes.ts and renders them. Adding a 7th
// service with its own questions means adding config, not a new screen.
// Field labels/placeholders/options are translated via the serviceFields /
// fieldOptions i18n namespaces (keyed by field.key / option.value), so a
// new service automatically gets translated copy as long as those keys
// are filled in - no per-service translation wiring needed here.
export default function RequestDetailsScreen({ navigation }: Props) {
  const t = useT();
  const { serviceType, setExtra } = useRequestStore();
  const savedVehicles = useAuthStore((s) => s.appUser?.vehicles) ?? [];
  const service = serviceType ? getServiceType(serviceType) : null;
  const serviceLabel = serviceType ? t(`services.${serviceType}.label`) : '';
  const fields = service?.extraFields ?? [];

  const [values, setValues] = useState<Record<string, string | number>>({});

  const canSubmit = fields
    .filter((f) => f.required)
    .every((f) => {
      const v = values[f.key];
      return v !== undefined && v !== '' && !(f.type === 'number' && Number.isNaN(Number(v)));
    });

  const itemCostPreview = useMemo(
    () => (service ? calculateItemCost(service, values) : 0),
    [service, values]
  );
  const hasItemCost = fields.some((f) => f.pricedBy);

  // Only mechanic/tow/garage ask for a vehicle - show the quick-fill row
  // only when that's actually on the form AND the client has vehicles saved.
  const hasVehicleFields =
    fields.some((f) => f.key === 'vehicleType') && fields.some((f) => f.key === 'vehicleMakeModel');
  const showVehiclePicker = hasVehicleFields && savedVehicles.length > 0;

  function setField(key: string, value: string | number) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function applySavedVehicle(vehicleType: string, makeModel: string) {
    setValues((prev) => ({ ...prev, vehicleType, vehicleMakeModel: makeModel }));
  }

  function handleContinue() {
    setExtra(values);
    navigation.navigate('ProviderList');
  }

  if (!service) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>
        {service.icon} {t('requestDetails.title', { service: serviceLabel.toLowerCase() })}
      </Text>

      {showVehiclePicker && (
        <View style={styles.savedVehiclesWrap}>
          <Text style={styles.label}>{t('requestDetails.useSavedVehicle')}</Text>
          <View style={styles.savedVehiclesRow}>
            {savedVehicles.map((v) => {
              const typeLabel = VEHICLE_TYPE_OPTIONS.find((o) => o.value === v.vehicleType)
                ? t(`fieldOptions.${v.vehicleType}`)
                : '';
              const isActive = values.vehicleMakeModel === v.makeModel && values.vehicleType === v.vehicleType;
              return (
                <Pressable
                  key={v.id}
                  style={[styles.savedVehicleChip, isActive && styles.savedVehicleChipActive]}
                  onPress={() => applySavedVehicle(v.vehicleType, v.makeModel)}
                >
                  <Text style={[styles.savedVehicleText, isActive && styles.savedVehicleTextActive]}>
                    {v.makeModel} {typeLabel ? `(${typeLabel})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {fields.map((field) => (
        <FieldInput key={field.key} field={field} value={values[field.key]} onChange={setField} />
      ))}

      {hasItemCost && (
        <View style={styles.pricePreview}>
          <Text style={styles.pricePreviewLabel}>{t('requestDetails.estimatedItemCost')}</Text>
          <Text style={styles.pricePreviewValue}>{itemCostPreview} {t('common.currency')}</Text>
          <Text style={styles.pricePreviewHint}>{t('requestDetails.deliveryCostHint')}</Text>
        </View>
      )}

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        disabled={!canSubmit}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>{t('common.continue')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ExtraFieldConfig;
  value: string | number | undefined;
  onChange: (key: string, value: string | number) => void;
}) {
  const t = useT();
  // Every field/option in config/serviceTypes.ts has a matching translated
  // entry (serviceFields.<key> / fieldOptions.<value>). Fall back to the
  // config's own English copy only if a key is ever missing, so a new
  // service that forgets to add a translation still renders something.
  const label = t(`serviceFields.${field.key}.label`) || field.label;
  const placeholder = field.placeholder ? t(`serviceFields.${field.key}.placeholder`) || field.placeholder : undefined;

  if (field.type === 'select') {
    const options = (field.options ?? []).map((o) => ({ value: o.value, label: t(`fieldOptions.${o.value}`) }));
    return (
      <SelectDropdown
        label={label}
        value={value as string | undefined}
        options={options}
        onChange={(v) => onChange(field.key, v)}
      />
    );
  }

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>
        {label} {field.unit ? `(${field.unit})` : ''}
      </Text>
      <TextInput
        style={[styles.input, field.type === 'textarea' && styles.textarea]}
        placeholder={placeholder}
        value={value !== undefined ? String(value) : ''}
        onChangeText={(text) =>
          onChange(field.key, field.type === 'number' ? text.replace(/[^0-9.]/g, '') : text)
        }
        keyboardType={field.type === 'number' ? 'numeric' : 'default'}
        multiline={field.type === 'textarea'}
        numberOfLines={field.type === 'textarea' ? 4 : 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 20 },
  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },

  savedVehiclesWrap: { marginBottom: 20 },
  savedVehiclesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  savedVehicleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  savedVehicleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  savedVehicleText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  savedVehicleTextActive: { color: '#fff' },

  pricePreview: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pricePreviewLabel: { fontSize: 12, color: colors.text },
  pricePreviewValue: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 2 },
  pricePreviewHint: { fontSize: 11, color: colors.text, marginTop: 6 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
