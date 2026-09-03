import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  try {
    if (!Device.isDevice) return null; // emulators/simulators can't get real push tokens

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      // setDoc+merge, not updateDoc: this can fire before signUp()'s own
      // setDoc has finished writing the user doc (onAuthStateChanged races
      // the initial profile write), and updateDoc silently fails - and gets
      // silently swallowed by the .catch() below - if the doc doesn't exist
      // yet. merge:true is safe either way: creates it if missing, patches
      // it if not.
      await setDoc(doc(db, 'users', uid), { pushDebug: 'permission not granted' }, { merge: true }).catch(() => {});
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      // Not yet linked to an EAS project (run `eas init`) - skip silently,
      // rest of the app works fine without push.
      await setDoc(doc(db, 'users', uid), { pushDebug: 'no projectId' }, { merge: true }).catch(() => {});
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    await setDoc(doc(db, 'users', uid), { pushToken: token, pushDebug: 'ok' }, { merge: true });
    if (isWorker) {
      // Moved off the publicly-readable providers/{uid} doc - see
      // firestore.rules. setDoc+merge since this doc may not exist yet
      // the first time a worker registers for push.
      await setDoc(doc(db, 'providers', uid, 'private', 'contact'), { pushToken: token }, { merge: true });
    }
    return token;
  } catch (e: any) {
    // TEMP debug aid: this used to be a fully silent catch-less call, so a
    // thrown error here (e.g. getExpoPushTokenAsync failing) never reached
    // Firestore or any log you could see on a standalone/preview build with
    // no Metro connection. Writing the message to the user doc means you
    // can read the actual failure straight from the Firestore console.
    // Remove the setDoc call (keep console.error) once this is diagnosed.
    console.error('registerForPushNotifications failed:', e);
    await setDoc(
      doc(db, 'users', uid),
      { pushDebug: `error: ${e?.message ?? String(e)}` },
      { merge: true }
    ).catch(() => {});
    return null;
  }
}

/**
 * Reads one provider's push token. Only succeeds if the caller IS that
 * provider, or currently has a pending/accepted request with them -
 * enforced entirely in firestore.rules, not here. Call this right after
 * createRequest() (which writes the activeClients mirror doc that grants
 * access) rather than pulling pushToken off the general provider-browse
 * list, which no longer carries it at all.
 */
export async function getProviderPushToken(providerId: string): Promise<string | undefined> {
  const snap = await getDoc(doc(db, 'providers', providerId, 'private', 'contact'));
  return snap.exists() ? (snap.data().pushToken as string | undefined) : undefined;
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