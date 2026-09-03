# Tari9

A roadside/vehicle-assistance app — request a mechanic, tow, taxi, ambulance, garage, or fuel delivery, get matched with a nearby provider in real time, and track the request through to completion.

Co-founded startup, ministry-labeled "Innovative Startup" in Algeria, winner of **Best Tourism Startup at SITEV 2023** (Wilaya of Tarf).

This repo is the React Native + Firebase rewrite of the original native Android (Java) app.

## Stack

- **React Native (Expo)** + **TypeScript**
- **Firebase** — Auth + Firestore (Spark/free plan)
- **MapLibre / OpenStreetMap** for maps and location picking
- **Zustand** for state
- **EAS Build** for standalone Android builds

## Features

- Client flow: pick a service → pick location on a map → see nearby providers ranked by distance → send a request → track live status (pending / accepted / declined / completed / cancelled) → request history
- Worker flow: provider onboarding, dashboard to accept/decline incoming requests, availability toggle, work history
- Distance-based pricing per service (base fee + per-meter rate, near/far threshold), with mechanic/garage shown as an estimate (final price agreed with the provider) and tow/taxi/ambulance/fuel shown as a firm number
- Saved vehicles (up to 3) that auto-fill mechanic/tow/garage requests
- National ID collected at signup, AES-encrypted before it ever reaches Firestore — providers only ever see a "✓ Verified" badge, never the number
- Live offline detection — a clear banner instead of a stuck spinner when connectivity drops
- Push notifications for request updates

## Architecture notes

**Config-driven service system.** Every service (mechanic, tow, taxi, ambulance, garage, fuel) is one entry in [`src/config/serviceTypes.ts`](src/config/serviceTypes.ts) — its label, icon, pricing rule, and the extra form fields it needs (vehicle type, issue description, passenger count, etc). One screen (`RequestDetailsScreen`) and one provider-facing card render whatever a service declares. Adding a 7th service is a config entry, not a new screen.

**National ID handling.** The ID is AES-encrypted client-side (`src/utils/idCrypto.ts`) before `setDoc` ever runs — plaintext never touches Firestore. The key lives in an env var, never in source. This is a client-only app (no backend), so it's worth being explicit about what this protects against: a leaked or misconfigured database, or someone browsing Firestore directly. It does not protect against someone reverse-engineering the built app itself, since Expo's `EXPO_PUBLIC_*` env vars are bundled into the binary — a normal limitation for client-only apps.

**Offline handling.** Firestore's `onSnapshot` listeners don't error on plain connectivity loss — with nothing cached yet, they just sit pending. `useNetworkStatus` (backed by `@react-native-community/netinfo`) gives every screen a real, independent signal instead, so the app tells you what's happening rather than hanging silently. It can't fully work offline — matching a live nearby provider inherently needs a connection, same as any app like this — but it never leaves you guessing why.

## Getting started

```bash
npm install
npx expo install @react-native-community/netinfo crypto-js react-native-get-random-values
```

Create a `.env` in the project root (see `.env.example` if present, or the vars referenced in `src/config/firebase.ts` and `src/utils/idCrypto.ts`):

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_ID_ENCRYPTION_KEY=
```

Run locally:

```bash
npx expo start
```

## Building a standalone APK

This project uses [EAS Build](https://docs.expo.dev/build/introduction/). The `development` profile in `eas.json` produces a dev-client build that needs a Metro server running — that's for local testing only. To produce a real, standalone, install-and-open APK (what you'd send someone to test):

```bash
npm install -g eas-cli
eas login

# one-time: push your .env values to EAS (they don't get read from your local .env automatically)
eas env:set --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..." --environment preview --visibility plaintext
# ...repeat for the other 5 Firebase vars, and:
eas env:set --name EXPO_PUBLIC_ID_ENCRYPTION_KEY --value "..." --environment preview --visibility sensitive

eas build --platform android --profile preview
```

That gives you a download link for a standalone APK — no dev server, no laptop required to open it.

## Project structure

```
src/
  components/     shared UI (SelectDropdown, OfflineBanner, ProviderCard, ...)
  config/         serviceTypes.ts - the single source of truth for every service
  hooks/          useNetworkStatus
  navigation/     RootNavigator, route types
  screens/        client screens + screens/worker/ for the provider flow
  services/       Firebase reads/writes (auth, requests, providers, push, geo)
  store/          Zustand stores (auth, in-progress request)
  types/          shared TypeScript types
  utils/          pricing, idCrypto
```

## Localization

`src/i18n/` holds English (`locales/en.ts`, the schema of record) and Arabic
(`locales/ar.ts`, typed against it — a missing key is a compile error).
`useLocaleStore` (`src/store/useLocaleStore.ts`) persists the chosen
locale and exposes a `useT()` hook; `LanguageToggle` handles the
RTL-relaunch that switching languages requires. `ServiceSelectScreen`,
`ServiceTypeCard`, `SignInScreen`, `SignUpScreen`, and
`WorkerDashboardScreen` are converted as a working example — see
`FIXES.md` for the remaining screens and the pattern to follow.

## Known limitations

- Requires connectivity to match with a live nearby provider (inherent to the real-time-matching model, not a bug)
- Single-device push notifications only, no multi-device sync of push tokens
- No in-app chat between client and provider yet (planned)
- Most screens outside the ones listed under Localization are still English-only
- Price is set client-side; Firestore rules block obviously-invalid values (negative/zero, post-creation edits) but can't verify a submitted price actually matches the pricing formula without a Cloud Function — see `FIXES.md`
- A provider's Expo push token is readable by any signed-in client (needed for the current client-sends-the-push architecture); closing this properly needs a Cloud Function to broker push delivery server-side — see `FIXES.md`
- National ID encryption key ships inside the app bundle (documented in `src/utils/idCrypto.ts`) — protects data at rest, not against reverse-engineering the installed app
- No automated tests yet