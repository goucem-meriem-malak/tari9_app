# Tari9 — Technical Documentation

Engineering reference for the React Native rewrite: data model, security rules,
core modules, and how the pieces fit together. For product framing / business
status, see `Tari9_Documentation.docx`. For setup and build commands, see
`README.md`. This doc goes deeper on *how the code works*.

---

## 1. Stack

| Layer | Technology | Notes |
|---|---|---|
| App framework | React Native 0.74.5 (Expo SDK 51, dev-client) + TypeScript | MapLibre is a native module, so this runs via a dev-client build, not plain Expo Go |
| State | Zustand 4.5 | `useAuthStore`, `useLocaleStore`, `useRequestStore` |
| Backend | Firebase 10.12 — Auth + Firestore | Spark (free) plan — no Cloud Functions |
| Maps | `@maplibre/maplibre-react-native` + OpenStreetMap | Nominatim for reverse geocoding |
| Push | Expo push service | Client-to-client token exchange, no server broker |
| Local persistence | AsyncStorage | Locale preference, auth session |
| Encryption | `crypto-js` (AES) | National ID, client-side only |
| Navigation | `@react-navigation/native-stack` | `RootNavigator.tsx` |
| Build | EAS Build | `eas.json`: development / preview / production profiles |

## 2. Repo layout

```
src/
  components/     AnimatedSplash, LanguageToggle, LoadingOverlay, OfflineBanner,
                   ProviderCard, SelectDropdown, ServiceTypeCard, Map/OsmMap
  config/         firebase.ts, serviceTypes.ts
  constants/      colors.ts, theme.ts        (design tokens — navy/gold)
  hooks/          useNetworkStatus.ts
  i18n/           index.ts, locales/en.ts (schema of record), locales/ar.ts
  navigation/     RootNavigator.tsx, types.ts
  screens/        MapPickerScreen, PaymentScreen, ProfileScreen, ProviderListScreen,
                   RequestDetailsScreen, RequestHistoryScreen, RequestStatusScreen,
                   ServiceSelectScreen
    auth/         SignInScreen, SignUpScreen
    worker/       WorkerDashboardScreen, WorkerHistoryScreen, WorkerOnboardingScreen,
                   WorkerProfileScreen
  services/       auth.ts, geo.ts, providerProfile.ts, providers.ts, push.ts, requests.ts
  store/          useAuthStore.ts, useLocaleStore.ts, useRequestStore.ts
  types/          index.ts
  utils/          distance.ts, idCrypto.ts, pricing.ts
scripts/
  seedProviders.ts   # populates sample provider data for local testing (npm run seed)
firestore.rules
app.json / eas.json
```

14 screens total; 4 use the i18n layer (see §8).

---

## 3. Data model (Firestore)

### `users/{uid}`
Client/worker account. Owner-only read/write. Holds profile fields, encrypted
`nationalId`, and `vehicles?: SavedVehicle[]` (up to 3, `{ id, vehicleType, makeModel }`).

### `providers/{providerId}`
One doc per worker's service listing. `ownerUid` and `type` are fixed at
creation and can't change afterward — only availability/name/phone/location
move post-onboarding. Readable by any signed-in user (clients need to browse
providers to request a service). **Does not** hold the push token (see below).

- `providers/{id}/private/contact` — the provider's Expo push token, split
  into its own doc specifically so it can carry a stricter rule than the
  parent (see §4).
- `providers/{id}/activeClients/{clientId}` — one doc per client currently in
  a pending/accepted request with this provider; a permission gate, not
  application data. Written/deleted in the same transaction as the matching
  request write in `requests.ts`, so it can't drift out of sync.

### `requests/{requestId}`
The core entity. Two field groups:

- **Immutable once created**: `clientId`, `providerId`, `type`, `price`,
  `distanceMeters`, `clientLocation`, `address`, `extra`, `createdAt`
- **Mutable, only via an allowed transition**: `state`, `updatedAt`,
  `providerLocation`, and the payment fields (`paymentMethod`,
  `paymentStatus`, `paidAt`)

`extra` holds whatever `ServiceTypeConfig.extraFields` for that service
declared (vehicle type, issue description, passenger count, fuel type +
quantity, etc — see §5).

---

## 4. Security rules & state machine (`firestore.rules`)

### Request state machine

```
pending   -> accepted   (provider only)
pending   -> declined   (provider only)
pending   -> cancelled  (client only)
accepted  -> completed  (provider only)
accepted  -> cancelled  (client only)
```

No other transition is legal, and once a request is `declined`, `completed`,
or `cancelled` it can't be edited again. Enforced identically in two places
that must be kept in sync by hand:

- **Server-side**: `isValidTransition()` in `firestore.rules`
- **Client-side**: an `ALLOWED_TRANSITIONS` table in `requests.ts`, checked
  inside a Firestore transaction that re-reads the current server state
  before writing — so a double-tap or two devices racing on the same
  request fails loudly instead of one silently overwriting the other.

Cancelling is a state transition, not a `deleteDoc` — `allow delete: if
false` on `requests/{requestId}`, so every request keeps a full audit trail.

### Payment guard

`isValidPaymentUpdate()`: client-only, requires `state == 'completed'`,
`state` itself must not change in the same write, and `paymentStatus` can
only move to `'paid'` once (rejected if already paid). A provider can never
set this — it checks `request.auth.uid == before.clientId`, so a provider
can't mark their own completed job as paid.

### Provider push-token isolation

Firestore rules can grant or deny a whole document, not "this doc minus one
field" — and `providers/{id}` has to stay broadly readable so clients can
browse listings. So the token lives in `providers/{id}/private/contact`
instead, with its own rule: readable by the provider themself, or by a
client that has a live `activeClients/{clientId}` mirror doc under that
provider. That mirror is **not** a trust-me flag — every write to it is
checked (`isValidMirrorWrite()`) against the real `requests/{requestId}` it
references: the request's `clientId`/`providerId` must match, and its state
must be `pending` or `accepted`. A client can't fabricate an entry to read a
token they have no active relationship to. `providers/{id}` create/update
rules additionally assert `!('pushToken' in request.resource.data)`, so the
token can never be smuggled back onto the parent doc through a normal
provider-profile write.

---

## 5. Config-driven service system (`src/config/serviceTypes.ts`)

Every service — mechanic, tow, taxi, ambulance, garage, fuel/`station` — is
one `ServiceTypeConfig` entry:

```ts
interface ServiceTypeConfig {
  id: ServiceTypeId;
  label: string;
  icon: string;
  description: string;
  extraFields?: ExtraFieldConfig[];   // the form fields RequestDetailsScreen renders
  pricing: PricingRule;
  pricingDisplay: 'exact' | 'estimateOnly';
}
```

`RequestDetailsScreen` and the provider-facing request card render whatever
a service declares — adding a 7th service is a config entry, not a new
screen. `ExtraFieldConfig` supports `text` / `textarea` / `number` / `select`
fields, and a `number` field can declare `pricedBy: <key of a select field>`
so its value is multiplied by that option's `unitPrice` — this is how fuel
delivery turns "5 liters of Diesel" into an item cost (`quantity ×
unitPrice`), shown separately from the distance-based delivery cost.

`VEHICLE_TYPE_OPTIONS` (10 types: car, SUV/4x4, motorcycle, van/minibus,
pickup, truck, bus, tricycle, tractor, other) is exported once and reused by
every vehicle-collecting service and the saved-vehicle picker in
`ProfileScreen`, rather than copy-pasted per screen.

`getServiceType(id)` throws on an unknown id rather than returning
`undefined` — fail loud on a config typo rather than rendering a blank form.

## 6. Pricing engine (`src/utils/pricing.ts` + `PricingRule`)

```ts
interface PricingRule {
  nearThresholdMeters: number;
  nearBaseFee: number;
  farBaseFee: number;
  perMeterRate: number;
}
```

`price = (distanceMeters <= nearThresholdMeters ? nearBaseFee : farBaseFee)
+ distanceMeters * perMeterRate`, computed **client-side** at request-creation
time (see §11 for why this is the one open integrity gap in the model).
`pricingDisplay: 'estimateOnly'` (mechanic, garage) shows this as a rough
call-out estimate — final price is agreed with the provider once they see
the issue. `'exact'` (tow, taxi, ambulance, fuel) shows it as a firm number.

## 7. Client & provider flows

**Client**: `ServiceSelectScreen` → `MapPickerScreen` (drop a pin or use
current location, reverse-geocoded via Nominatim) → `ProviderListScreen`
(nearby providers ranked by distance, `src/services/geo.ts` /
`src/utils/distance.ts`) → `RequestDetailsScreen` (per-service extra fields,
saved-vehicle chip row) → request created → `RequestStatusScreen` (live
state, cancel, pay) → `RequestHistoryScreen`.

**Worker**: `WorkerOnboardingScreen` (creates the `providers/{uid}` doc once)
→ `WorkerDashboardScreen` (incoming requests, accept/decline, availability
toggle, active job) → `WorkerHistoryScreen` (completed jobs, paid/unpaid
badge) → `WorkerProfileScreen`.

**Payment**: reachable from `RequestStatusScreen` right after a job
completes, or later from `RequestHistoryScreen` (a completed-and-unpaid row
is tappable) — this second path closes what used to be a dead end: a client
who'd left the status screen before the job was marked completed previously
had no way back to pay. `PaymentScreen` offers cash (confirms instantly) or
card (simulated ~1.4s "processing" delay, no live gateway), then calls
`payForRequest(requestId, method)` in `requests.ts`, which is the guarded
transaction backing `isValidPaymentUpdate()` in the rules.

## 8. State management

Three Zustand stores:

- `useAuthStore` — current Firebase user, role (client/worker), sign-in state
- `useLocaleStore` — persisted locale (AsyncStorage) + hydration on boot
- `useRequestStore` — the client's in-progress request as it moves through
  the flow above

No Redux/Context boilerplate — each store is a plain hook.

## 9. Localization (`src/i18n/`)

`locales/en.ts` is the schema of record — every user-facing string, grouped
by screen/feature. `locales/ar.ts` is typed against `TranslationSchema =
typeof en`, so a missing Arabic key is a **compile error**, not a silent
English fallback in production. `useLocaleStore` persists the chosen locale
and exposes `useT()` for components; `LanguageToggle` handles the mid-session
case — switching EN↔AR flips `I18nManager` RTL state, which React Native
only applies on next launch, so it calls `Updates.reloadAsync()` (with a
manual-restart alert as fallback where that API isn't available, e.g. Expo
Go).

**Converted**: `ServiceSelectScreen`, `ServiceTypeCard`, `SignInScreen`,
`SignUpScreen`, `WorkerDashboardScreen`. **Not yet converted** (hardcoded
English, same `useT()` pattern applies): `ProfileScreen`,
`WorkerProfileScreen`, `WorkerOnboardingScreen`, `RequestDetailsScreen`,
`ProviderListScreen`, `RequestStatusScreen`, `RequestHistoryScreen`,
`WorkerHistoryScreen`, `MapPickerScreen`, `PaymentScreen`. Also not done:
flipping `flexDirection: 'row'` → `'row-reverse'` (or relying on RN's
automatic RTL flip once `I18nManager.isRTL` is true) across every
`StyleSheet` — only checked by hand on the five converted surfaces.

## 10. Offline handling

Firestore's `onSnapshot` listeners don't error on plain connectivity loss —
with nothing cached yet, they just sit pending indefinitely, which is what
used to leave screens (provider search especially) spinning with no
explanation. `useNetworkStatus` (backed by `@react-native-community/netinfo`)
gives every screen a real, independent connectivity signal instead of
relying on a Firestore callback ever firing. `OfflineBanner` is wired into
`RootNavigator` — visible on every screen, sign-in included, gone the
instant connectivity returns. Already-loaded screens keep working from
Firestore's in-memory cache while the app stays open (the JS SDK does this
automatically); what was missing was *telling the user* what's going on when
a screen has nothing cached yet. Hard limit, not fixable client-side: the
app can't match a live nearby provider with zero connectivity — no app like
this can.

## 11. Known technical debt

- **Price is unvalidated server-side.** `firestore.rules` blocks an
  obviously-invalid submitted price (negative/zero, or any post-creation
  edit — see `immutableFieldsUnchanged()`), but can't verify a submitted
  price actually equals `distanceMeters × rate + baseFee` for that service,
  because rules have no access to `serviceTypes.ts`'s pricing table. Real
  fix needs a Cloud Function to recompute and overwrite price server-side on
  create (needs the Blaze plan), or duplicating the pricing table into the
  rules file itself (fragile — two sources of truth).
- **National ID encryption key ships in the app bundle.** `idCrypto.ts`
  documents this: protects the ID at rest in Firestore against casual DB
  access, not against decompiling the installed app (`EXPO_PUBLIC_*` env
  vars are bundled into the binary). Real fix is server-side encryption.
- **No automated tests.** `pricing.ts` and the `ALLOWED_TRANSITIONS` table
  in `requests.ts` are the cheapest place to start — pure functions, no
  Firestore/RN dependency.
- **No real payment gateway.** Card payment is a timed fake delay; no
  commission/revenue model wired to any of it yet.
- **Localization/RTL coverage** — see §9, 10 of 14 screens still English-only.
- A Firebase Admin SDK service-account key file was found in the project
  root alongside the public `google-services.json` during review — confirm
  it's excluded from version control (and rotate it if it was ever
  committed) before this repo is shared externally.

Resolved since the last review (kept here for context, not action items):
provider push-token exposure — see §4.
