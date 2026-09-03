import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { SERVICE_TYPES } from '@/config/serviceTypes';
import { useRequestStore } from '@/store/useRequestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/store/useLocaleStore';
import ServiceTypeCard from '@/components/ServiceTypeCard';
import LanguageToggle from '@/components/LanguageToggle';
import { colors } from '@/constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceSelect'>;

export default function ServiceSelectScreen({ navigation }: Props) {
  const setServiceType = useRequestStore((s) => s.setServiceType);
  const appUser = useAuthStore((s) => s.appUser);
  const t = useT();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.greeting}>
            {t('serviceSelect.greeting')}
            {appUser?.firstName ? `, ${appUser.firstName}` : ''} 👋
          </Text>
          <LanguageToggle />
        </View>
        <Text style={styles.subtitle}>{t('serviceSelect.subtitle')}</Text>
      </View>

      <FlatList
        data={SERVICE_TYPES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ServiceTypeCard
            service={item}
            onPress={() => {
              setServiceType(item.id);
              navigation.navigate('MapPicker');
            }}
          />
        )}
      />

      <View style={styles.footerNav}>
        <Pressable onPress={() => navigation.navigate('RequestHistory')}>
          <Text style={styles.footerLink}>{t('common.history')}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.footerLink}>{t('common.profile')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingBottom: 8 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  list: { padding: 20, paddingTop: 8 },
  footerNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  footerLink: { color: colors.primary, fontWeight: '600', fontSize: 14 },
});
