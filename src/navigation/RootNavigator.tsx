import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { subscribeToAuth, getAppUser } from '@/services/auth';
import { getProviderProfile } from '@/services/providerProfile';
import { registerForPushNotifications } from '@/services/push';
import { useAuthStore } from '@/store/useAuthStore';
import { colors } from '@/constants/colors';
import OfflineBanner from '@/components/OfflineBanner';

import SignInScreen from '@/screens/auth/SignInScreen';
import SignUpScreen from '@/screens/auth/SignUpScreen';
import ServiceSelectScreen from '@/screens/ServiceSelectScreen';
import MapPickerScreen from '@/screens/MapPickerScreen';
import RequestDetailsScreen from '@/screens/RequestDetailsScreen';
import ProviderListScreen from '@/screens/ProviderListScreen';
import RequestStatusScreen from '@/screens/RequestStatusScreen';
import RequestHistoryScreen from '@/screens/RequestHistoryScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import WorkerOnboardingScreen from '@/screens/worker/WorkerOnboardingScreen';
import WorkerDashboardScreen from '@/screens/worker/WorkerDashboardScreen';
import WorkerHistoryScreen from '@/screens/worker/WorkerHistoryScreen';
import WorkerProfileScreen from '@/screens/worker/WorkerProfileScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const {
    firebaseUid,
    appUser,
    providerProfile,
    initializing,
    setFirebaseUid,
    setAppUser,
    setProviderProfile,
    setInitializing,
  } = useAuthStore();

  useEffect(() => {
    const unsub = subscribeToAuth(async (user) => {
      setFirebaseUid(user?.uid ?? null);
      if (user) {
        const appUser = await getAppUser(user.uid);
        setAppUser(appUser);
        if (appUser?.role === 'worker') {
          const provider = await getProviderProfile(user.uid);
          setProviderProfile(provider);
        } else {
          setProviderProfile(null);
        }
        // Best-effort - silently no-ops if permission denied or no EAS project yet
        registerForPushNotifications(user.uid, appUser?.role === 'worker');
      } else {
        setAppUser(null);
        setProviderProfile(null);
      }
      setInitializing(false);
    });
    return unsub;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isWorker = appUser?.role === 'worker';
  const workerNeedsOnboarding = isWorker && !providerProfile;

  return (
    <NavigationContainer>
      <OfflineBanner />
      <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
        {!firebaseUid ? (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
          </>
        ) : workerNeedsOnboarding ? (
          <Stack.Screen
            name="WorkerOnboarding"
            component={WorkerOnboardingScreen}
            options={{ title: 'Set Up Your Service' }}
          />
        ) : isWorker ? (
          <>
            <Stack.Screen name="WorkerDashboard" component={WorkerDashboardScreen} options={{ title: 'Tari9 Provider' }} />
            <Stack.Screen name="WorkerHistory" component={WorkerHistoryScreen} options={{ title: 'Job History' }} />
            <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} options={{ title: 'Profile' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="ServiceSelect" component={ServiceSelectScreen} options={{ title: 'Tari9' }} />
            <Stack.Screen name="MapPicker" component={MapPickerScreen} options={{ title: 'Your Location' }} />
            <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} options={{ title: 'Details' }} />
            <Stack.Screen name="ProviderList" component={ProviderListScreen} options={{ title: 'Nearby Providers' }} />
            <Stack.Screen name="RequestStatus" component={RequestStatusScreen} options={{ title: 'Request Status' }} />
            <Stack.Screen name="RequestHistory" component={RequestHistoryScreen} options={{ title: 'History' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
