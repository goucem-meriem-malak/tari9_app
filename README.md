<p align="center">
  <img src="./assets/logo.png" alt="Tari9 logo" width="120" />
</p>

# Tari9

A roadside/vehicle-assistance app — request a mechanic, tow, taxi, ambulance, garage, or fuel delivery, get matched with a nearby provider in real time, and track the request through to completion and payment.

Co-founded startup, ministry-labeled "Innovative Startup" in Algeria, winner of **Best Tourism Startup at SITEV 2023** (Wilaya of Tarf).

This repo is the React Native + Firebase rewrite of the original native Android (Java) app.

## Stack

- **React Native 0.74** (Expo SDK 51, dev-client, `app.config.js` dynamic config) + **TypeScript**
- **Firebase** — Auth + Firestore (Spark/free plan)
- **MapLibre** (`@maplibre/maplibre-react-native`) for maps and location picking — a native module, so this project runs via an EAS dev-client build, not plain Expo Go
- **Zustand** for state
- **EAS Build** for standalone Android builds

## Features

- **Client flow**: pick a service → pick location on a map → see nearby providers ranked by distance → send a request → track live status (pending / accepted / declined / completed / cancelled) → request history
- **Worker flow**: provider onboarding, dashboard to accept/decline incoming requests, availability toggle, work history
- **6 service types**, each one config entry in `src/config/serviceTypes.ts`: mechanic, tow truck, taxi, ambulance, garage, fuel/oil delivery
- **Distance-based pricing** per service (base fee + per-meter rate, near/far threshold at 1km) — mechanic and garage show as a rough call-out estimate (final price agreed with the provider on-site), tow/taxi/ambulance/fuel show as a firm number. Fuel delivery breaks price into item cost (quantity × per-liter rate) and delivery cost, shown separately.
- **Payment**: after a job is marked completed, the client picks cash or card on a Payment screen (card is currently simulated — no live gateway) and the request is marked paid, once, guarded by a Firestore transaction. Reachable both right after completion and later from Request History, so leaving the live status screen doesn't strand an unpaid job. Localization already has placeholder strings for Edahabia/CIB (Algeria) and mada/STC Pay (Saudi) as future local payment methods — not wired into the payment type yet.
- **Saved vehicles** (up to 3 per profile) that auto-fill mechanic/tow/garage requests via a "use a saved vehicle" chip row, still editable per request
- **National ID** collected at signup, AES-encrypted before it ever reaches Firestore — providers only ever see a "✓ Verified" badge, never the number
- **Live offline detection** — a persistent banner (not a stuck spinner) the moment connectivity drops, on every screen including sign-in; already-loaded screens keep working from Firestore's cache
- **Push notifications** for request updates, gated behind a provider-owned, request-scoped access rule (see Security below) rather than a broadly-readable field
- **Arabic / RTL support** — a typed i18n layer where a missing Arabic key is a compile error, not a silent English fallback

## Architecture notes

**Config-driven service system.** Every service is one entry in [`src/config/serviceTypes.ts`](src/config/serviceTypes.ts) — its label, icon, pricing rule, and the extra form fields it needs (vehicle type, issue description, passenger count, fuel type + quantity, ...). One screen (`RequestDetailsScreen`) and one provider-facing card render whatever a service declares. Adding a 7th service is a config entry, not a new screen.

**National ID handling.** The ID is AES-encrypted client-side (`src/utils/idCrypto.ts`) before `setDoc` ever runs — plaintext never touches Firestore. The key lives in an env var, never in source. This is a client-only app (no backend), so it's worth being explicit about what this protects against: a leaked or misconfigured database, or someone browsing Firestore directly. It does not protect against someone reverse-engineering the built app itself, since Expo's `EXPO_PUBLIC_*` env vars are bundled into the binary — a normal limitation for client-only apps.

**Offline handling.** Firestore's `onSnapshot` listeners don't error on plain connectivity loss — with nothing cached yet, they just sit pending. `useNetworkStatus` (backed by `@react-native-community/netinfo`) gives every screen a real, independent signal instead. It can't fully work offline — matching a live nearby provider inherently needs a connection, same as any app like this — but it never leaves you guessing why.

**Security model (`firestore.rules`).** Requests are a strict state machine (`pending → accepted/declined`, `accepted → completed`, and `pending`/`accepted → cancelled`), enforced server-side — every field except `state`/`updatedAt`/`providerLocation` is immutable once a request is created, and only the exact transitions above are legal writes; cancelling is a state transition, not a delete, so there's a full audit trail. Payment updates get their own guard: client-only, only from `completed`, only once. A provider's Expo push token doesn't live on the broadly-readable `providers/{id}` document at all — it's split into a `providers/{id}/private/contact` subcollection, readable only by the provider themself or a client with a currently active (pending/accepted) request with them, verified against an `activeClients` mirror doc that's checked against the real request rather than trusted blindly.

## Getting started

```bash
npm install
```

This project uses native modules (MapLibre, Reanimated, notifications) that plain Expo Go can't run — you'll need a dev-client build (see "Building a standalone APK" below) or `npx expo run:android` / `run:ios` locally.

Create a `.env` in the project root:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_ID_ENCRYPTION_KEY=
```

You'll also need `google-services.json` (Android Firebase config) locally — get this from the Firebase console. It's gitignored, along with `.env` and the Firebase Admin SDK service-account key used by `scripts/seedProviders.ts` — none of the three are committed to the repo. `app.config.js` (a dynamic config, replacing the old static `app.json`) reads the Google services file path from `process.env.GOOGLE_SERVICES_JSON`, falling back to `./google-services.json` for local dev — so EAS builds pull it from an environment variable rather than a tracked file (see "Building a standalone APK" below).

Run locally:

```bash
npx expo start --dev-client
```

Seed sample providers (optional, for local testing — needs the Admin SDK service-account key locally, not committed):

```bash
npm run seed
```

## Building a standalone APK

This project uses [EAS Build](https://docs.expo.dev/build/introduction/). The `development` profile in `eas.json` produces a dev-client build that needs a Metro server running — local testing only. To produce a real, standalone, install-and-open APK:

```bash
npm install -g eas-cli
eas login

# one-time: push your Google services file and .env values to EAS
eas env:set --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment preview --visibility secret

eas env:set --name EXPO_PUBLIC_FIREBASE_API_KEY --value "..." --environment preview --visibility plaintext
# ...repeat for the other 5 Firebase vars, and:
eas env:set --name EXPO_PUBLIC_ID_ENCRYPTION_KEY --value "..." --environment preview --visibility sensitive

eas build --platform android --profile preview
```

**Deploy Firestore rules alongside any rules change**: `firebase deploy --only firestore:rules` — the payment flow and provider push-token access both depend on the current rules file being live, not just present in the repo.

## Project structure

```
src/
  components/     shared UI (SelectDropdown, OfflineBanner, ProviderCard, AnimatedSplash,
                  LanguageToggle, LoadingOverlay, ServiceTypeCard, Map/OsmMap)
  config/         firebase.ts, serviceTypes.ts - single source of truth for every service
  constants/      colors.ts, theme.ts - design tokens (navy/gold)
  hooks/          useNetworkStatus
  i18n/           locales/en.ts (schema of record), locales/ar.ts (typed against it)
  navigation/     RootNavigator, route types
  screens/        client screens + auth/ (sign in/up) + worker/ (provider flow)
  services/       Firebase reads/writes (auth, requests, providers, providerProfile, push, geo)
  store/          Zustand stores (auth, locale, in-progress request)
  types/          shared TypeScript types
  utils/          pricing, idCrypto, distance
scripts/          seedProviders.ts - populate sample provider data for local testing
```

## Localization

`src/i18n/` holds English (`locales/en.ts`, the schema of record) and Arabic (`locales/ar.ts`, typed against it — a missing key is a compile error). `useLocaleStore` persists the chosen locale and exposes a `useT()` hook; `LanguageToggle` handles the RTL-relaunch that switching languages requires. `ServiceSelectScreen`, `ServiceTypeCard`, `SignInScreen`, `SignUpScreen`, and `WorkerDashboardScreen` are converted as a working example. Remaining screens (`ProfileScreen`, `WorkerProfileScreen`, `WorkerOnboardingScreen`, `RequestDetailsScreen`, `ProviderListScreen`, `RequestStatusScreen`, `RequestHistoryScreen`, `WorkerHistoryScreen`, `MapPickerScreen`) still hold hardcoded English — same `useT()` pattern applies, it's repetitive work rather than new design. RTL layout flips (`flexDirection: 'row'` → `'row-reverse'`, or relying on RN's automatic flip once `I18nManager.isRTL` is true) have only been checked by hand on the five converted screens.

## Known limitations

- Requires connectivity to match with a live nearby provider (inherent to the real-time-matching model, not a bug)
- Single-device push notifications only, no multi-device sync of push tokens
- No in-app chat between client and provider yet (planned)
- Most screens outside the ones listed under Localization are still English-only
- **Price is set client-side**, unvalidated against the pricing formula. Firestore rules block obviously-invalid values (negative/zero, post-creation edits) but can't verify a submitted price actually matches `distanceMeters × rate + baseFee` without a Cloud Function reading `serviceTypes.ts` server-side — this needs the Blaze plan.
- **No real payment gateway** — card payment is simulated (~1.4s fake "processing" delay, no network call); cash just confirms instantly. No commission/revenue model wired to any of it yet.
- **National ID encryption key ships inside the app bundle** (documented in `src/utils/idCrypto.ts`) — protects data at rest in Firestore, not against someone reverse-engineering the installed app. A real fix means moving encryption server-side.
- No automated tests yet. `pricing.ts` and the transition-table logic in `requests.ts` are pure functions with no Firestore/RN dependency — cheapest place to start.
