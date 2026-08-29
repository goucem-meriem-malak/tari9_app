# Tari9 — Roadside & Vehicle Services Platform (React Native)

A cross-platform rebuild of an original native-Android app (2022, Java) —
a two-sided marketplace connecting drivers with nearby roadside-assistance
and vehicle-service providers (mechanics, tow trucks, taxis, ambulances,
garages, fuel delivery).

This isn't a straight port. It's a deliberate refactor: the original had
six near-identical Android Activities (`list_mechanics`, `list_garage`,
`list_taxis`, `list_tows`, `list_ambulance`, `list_stations`), each
hardcoding one Firestore collection name and one pricing formula. This
version collapses all six into **one config-driven matching engine**
(`src/config/serviceTypes.ts` + `src/screens/ProviderListScreen.tsx`) —
adding a 7th service type is one config entry, not one new screen.

**Status: client and worker apps both implemented, in one codebase.**
The role picked at signup determines which stack the navigator shows.

## What it does

- Email/password auth, with a role chosen at signup: **client** or **worker**
- **Client side:** pick a service type → drop a pin on a map → see nearby
  available providers of that type, live-sorted by distance → send a
  request → live status screen → history
- **Worker side:** onboarding sets up your provider listing (service type,
  business name, phone, base location) → dashboard with an online/offline
  toggle, live incoming requests, accept/decline, an active-job card with
  "Call Client" and "Mark Completed" → job history
- Real-time Firestore listeners throughout: provider list, request status,
  and incoming requests all update live, no polling/refresh needed
- Dynamic, distance-based pricing per service type (tiered base fee +
  per-meter rate)
- Full request lifecycle: pending → accepted/declined → completed/cancelled

## Stack, and why

| Piece | Choice | Why |
|---|---|---|
| Framework | Expo (TypeScript) | No native project files to hand-edit; fast iteration |
| Auth + DB | Firebase Auth + Firestore (Spark/free plan) | No billing account required, doesn't pause on inactivity, free real-time listeners |
| Maps | MapLibre + raw OpenStreetMap tiles | No API key, no billing account — the original project's Google Maps SDK billing requirement is what blocked it from ever being published |
| Geocoding | Nominatim (OSM) | Free, no key, consistent with the rest of the free/OSM map stack |
| State | Zustand | Small, no-boilerplate global state for the in-progress request flow |
| Navigation | React Navigation (native stack) | Standard, auth-gated stack switch |

## Project structure

```
src/
  config/         Firebase init, and the service-type config that
                   replaces six duplicated Android screens
  types/          Shared TypeScript types
  services/       Firebase/Firestore/geo calls - no UI here
                   (auth, providers, providerProfile, requests, geo)
  store/          Zustand stores (auth session + role, in-progress
                   request flow)
  navigation/     Role-gated stack navigator: auth -> worker onboarding
                   (if needed) -> worker OR client stack
  components/     Reusable cards, map wrapper, loading overlay
  screens/        Client screens (one per step of the request flow)
    auth/         Sign in / sign up (role picked here)
    worker/       Onboarding, dashboard, history, profile
scripts/
  seedProviders.ts  Seeds demo provider data for testing the client flow
firestore.rules     Security rules - each role can only touch its own data
```

## How the two roles share one data model

- `users/{uid}` - profile doc for every account, `role: 'client' | 'worker'`
- `providers/{uid}` - a worker's own listing, **doc ID == their uid**, so
  there's no query needed to find "my profile," just `doc(providers, uid)`
- `requests/{id}` - created by a client against one specific `providerId`
  they picked from the list; both sides read/write the same doc as its
  `state` moves through the lifecycle, and Firestore listeners on each
  side pick up every change instantly

## Push notifications, without a billing account

Real push notifications normally need a server watching for database
changes (on Firebase, that's Cloud Functions - which require the Blaze
plan and a billing card). This app avoids that entirely: whichever client
causes a state change also sends the push itself, directly to Expo's
public push endpoint, right after writing to Firestore. No server, no
Cloud Functions, no Blaze.

- Client sends a request → worker gets pushed
- Worker accepts → client gets pushed

This needs a free Expo account and an EAS project ID (`eas init`), but
never a billing card. Without it, the app still works fully via the live
Firestore listeners - you just won't get a notification while the app is
backgrounded/closed.

## Running it

1. Create a free Firebase project (Spark plan - no card needed), enable
   Email/Password auth and Firestore.
2. Copy `.env.example` to `.env` and fill in your Firebase config values.
3. (Recommended) Publish `firestore.rules` to your project - Firestore
   Console → Rules tab → paste the file's contents → Publish. Test mode
   (open read/write) is fine while building, but switch to these rules
   before this goes anywhere near real users.
4. `npm install`
5. Link a free Expo account so push notifications can get a project ID
   (no billing card, ever):
   ```
   npx eas login
   npx eas init
   ```
6. This app uses MapLibre, a native module - it needs a **dev client**,
   not plain Expo Go:
   ```
   npx expo install expo-dev-client
   npx expo run:android
   ```
7. Seed some mock providers so the client-side flow has data to query
   against without needing a second device signed in as a worker:
   ```
   npm run seed
   ```
8. To test the full loop end-to-end: sign up one account as a **worker**
   (on a second device, or sign out/in on the same one) to create a real
   provider listing, then sign up a second account as a **client** and
   send that provider a request - watch it appear live on the worker's
   dashboard, and a push notification arrive if both devices are real
   physical devices (push tokens don't work on emulators).

## Next phase

- Push notifications via FCM (free, no billing, already in the same
  Firebase project) when a request is accepted or a new one comes in
- Ratings after a completed request
- Provider-side location updates while en route (currently fixed at
  their base location from onboarding)
