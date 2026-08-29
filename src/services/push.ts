import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Push notifications with NO server-side trigger, and therefore no
 * Firebase Blaze/billing requirement:
 *
 * The client that performs an action (client sends a request, worker
 * accepts one) calls Expo's public push endpoint directly, right after
 * writing to Firestore. There's no Cloud Function watching for changes -
 * the app that caused the change is also the one that sends the push.
 *
 * This needs a free Expo account + a project ID (`eas init`), but never
 * a billing card.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission, gets this device's Expo push token,
 * and saves it on the user's doc (and their provider doc too, if they're
 * a worker, so request-creation lookups don't need an extra read).
 */
export async function registerForPushNotifications(
  uid: string,
  isWorker: boolean
): Promise<string | null> {
  if (!Device.isDevice) return null; // emulators/simulators can't get real push tokens

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    // Not yet linked to an EAS project (run `eas init`) - skip silently,
    // rest of the app works fine without push.
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const token = tokenData.data;

  await updateDoc(doc(db, 'users', uid), { pushToken: token });
  if (isWorker) {
    await updateDoc(doc(db, 'providers', uid), { pushToken: token });
  }
  return token;
}

/**
 * Sends a push via Expo's public endpoint - no auth, no server, just an
 * HTTPS POST. Best-effort: a failed push should never break the request
 * flow itself, so errors are swallowed here.
 */
export async function sendPushNotification(
  expoPushToken: string | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!expoPushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: expoPushToken,
        title,
        body,
        data,
        sound: 'default',
      }),
    });
  } catch {
    // Silent - notifications are a nice-to-have, not core to the request flow
  }
}
