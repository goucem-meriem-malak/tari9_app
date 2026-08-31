import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Live connectivity state, backed by @react-native-community/netinfo.
 *
 * Why this exists: Firestore's onSnapshot listeners don't error out when the
 * device just loses connectivity - with no cached data yet, they simply sit
 * pending until reconnect, which is what was causing screens (provider
 * search, in particular) to hang on a loading spinner forever with zero
 * feedback. This hook gives every screen a real, independent signal of
 * "are we actually online right now" that doesn't depend on a Firestore
 * callback ever firing.
 *
 * isOffline starts `false` (assume online) until the first NetInfo event
 * arrives, so a screen doesn't flash an offline state on a fast connection.
 */
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isConnected can be null while NetInfo is still figuring it out -
      // only flip to "offline" once we get a definite `false`.
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
      setIsChecking(false);
    });
    return () => unsubscribe();
  }, []);

  return { isOffline, isChecking };
}
