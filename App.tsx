import 'react-native-get-random-values'; // must be first import - gives crypto-js real randomness on RN
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '@/navigation/RootNavigator';
import AnimatedSplash from '@/components/AnimatedSplash';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <SafeAreaProvider>
      <StatusBar style={showSplash ? 'light' : 'dark'} />
      {showSplash ? (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      ) : (
        <RootNavigator />
      )}
    </SafeAreaProvider>
  );
}
