import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

export interface SelectDropdownOption {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  value: string | undefined;
  options: SelectDropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}

/**
 * A tap-to-open dropdown (closed field -> bottom-sheet option list), used
 * anywhere a service field or a profile field needs a `select` control.
 * Self-contained (owns its own open/closed state) so any screen can drop
 * one in without wiring up shared modal state.
 */
export default function SelectDropdown({ label, value, options, placeholder, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}>
          {selected ? selected.label : placeholder ?? 'Select...'}
        </Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            {label ? <Text style={styles.modalTitle}>{label}</Text> : null}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    style={styles.modalRow}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.modalRowText, isSelected && styles.modalRowTextActive]}>
                      {item.label}
                    </Text>
                    {isSelected && <Text style={styles.modalCheck}>✓</Text>}
                  </Pressable>
                );
              }}
            />
            <Pressable style={styles.modalCancel} onPress={() => setOpen(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 18 },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  dropdown: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 15, color: colors.text },
  dropdownPlaceholder: { color: colors.textMuted },
  dropdownChevron: { fontSize: 14, color: colors.textMuted, marginLeft: 8 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 4,
    maxHeight: '65%',
  },
  modalTitle: { fontSize: 14, fontWeight: '700', color: colors.textMuted, paddingHorizontal: 16, paddingBottom: 8 },
  modalList: { paddingHorizontal: 8 },
  modalSeparator: { height: 1, backgroundColor: colors.border },
  modalRow: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRowText: { fontSize: 15, color: colors.text },
  modalRowTextActive: { color: colors.primary, fontWeight: '700' },
  modalCheck: { fontSize: 15, color: colors.primary, fontWeight: '700' },
  modalCancel: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
  },
  modalCancelText: { fontSize: 15, color: colors.danger, fontWeight: '600' },
});
