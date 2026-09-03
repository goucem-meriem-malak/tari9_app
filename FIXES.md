# Fixes applied — 2026-08-31

This documents what changed in response to the code review, file by file,
and what's intentionally left open (with why).

## Fixed

**`firestore.rules`** — rewritten.
- `requests`: create now requires `state == 'pending'`, a positive `price`,
  and a non-negative `distanceMeters`. Update now requires (a) every
  immutable field (`clientId`, `providerId`, `type`, `price`, `distanceMeters`,
  `clientLocation`, `address`, `extra`, `createdAt`) to stay unchanged, and
  (b) the `state` change to match one specific allowed transition
  (`pending→accepted/declined/cancelled`, `accepted→completed/cancelled`).
  Nothing else is a legal update. Delete is now fully disallowed — cancel is
  a state transition, not a delete (see `requests.ts` below).
- `providers`: create/update now checks `ownerUid`/`type` can't be changed
  out from under a listing after onboarding.
- Read access on `providers` is still broad (any signed-in user, needed for
  discovery) — see the "Not fixed" section below for why `pushToken`
  exposure through this can't be closed with rules alone.

**`src/services/requests.ts`** — rewritten.
- `cancelRequest` no longer calls `deleteDoc`. It's now
  `updateRequestState(id, 'cancelled')`, so requests keep a full audit
  trail and a provider mid-response sees *why* a request disappeared
  instead of it just vanishing.
- `updateRequestState` now runs inside a Firestore transaction that
  re-reads the current server-side state and checks it against an
  `ALLOWED_TRANSITIONS` table before writing — mirrors `firestore.rules`
  exactly, so a double-tap or two devices racing on the same request fails
  loudly (`Can't move this request from "X" to "Y"...`) instead of silently
  overwriting whichever one committed last.

**`src/screens/worker/WorkerDashboardScreen.tsx`** and
**`src/screens/RequestStatusScreen.tsx`** — accept/decline/complete/cancel
calls are now wrapped in try/catch and surface the transaction's error via
`Alert.alert` instead of letting a rejected promise disappear silently.

**`app.json`** — Android `permissions` array had `ACCESS_FINE_LOCATION` /
`ACCESS_COARSE_LOCATION` each listed twice (short-form and fully-qualified).
Deduped to two entries.

**Arabic / RTL support (new)** — `src/i18n/`, `src/store/useLocaleStore.ts`,
`src/components/LanguageToggle.tsx`.
- A small typed i18n layer: `src/i18n/locales/en.ts` is the schema of record;
  `ar.ts` is typed against it (`TranslationSchema`), so a missing Arabic
  key is a compile error, not a silent English fallback in production.
- `useLocaleStore` persists the chosen locale (AsyncStorage) and exposes
  `useT()` for components.
- `App.tsx` hydrates the saved locale on boot and syncs React Native's
  `I18nManager` RTL state to it. `LanguageToggle` handles the mid-session
  case (switching EN↔AR flips layout direction, which RN only applies on
  next launch) by calling `Updates.reloadAsync()`, with a manual-restart
  alert as fallback when that API isn't available (e.g. Expo Go).
- **Converted to use it, as a working example of the pattern:**
  `ServiceSelectScreen`, `ServiceTypeCard` (+ the 6 service labels/
  descriptions in `services.*`), `SignInScreen`, `SignUpScreen`,
  `WorkerDashboardScreen`.
- **Not yet converted** (still hardcoded English — same `useT()` pattern
  applies, it's just repetitive work): `ProfileScreen`, `WorkerProfileScreen`,
  `WorkerOnboardingScreen`, `RequestDetailsScreen`, `ProviderListScreen`,
  `RequestStatusScreen`, `RequestHistoryScreen`, `WorkerHistoryScreen`,
  `MapPickerScreen`. Also not done: flipping `flexDirection: 'row'` →
  `'row-reverse'` (or using RN's automatic RTL flip, which handles most of
  this for free once `I18nManager.isRTL` is true) across every StyleSheet —
  the four converted screens' layouts were checked by hand for this, the
  rest weren't.

## Not fixed — architectural, flagged instead of hidden

**Price is still computed and set client-side, unvalidated against the
actual pricing formula.** `firestore.rules` now enforces "price must be a
positive number and can't change after creation," which stops the most
obvious tampering (submitting a negative or zero price, or editing the
price after the fact), but it can't verify a submitted price actually
matches `distanceMeters × rate + baseFee` for that service, because
Firestore rules don't have access to `src/config/serviceTypes.ts`'s pricing
table. Closing this properly needs either a Cloud Function (Blaze plan)
that recomputes and overwrites price server-side on create, or duplicating
the pricing table into the rules file itself (fragile — two sources of
truth to keep in sync). Worth deciding before this goes further.

**`providers.pushToken` is still readable by any signed-in client.** Any
authenticated user can query the `providers` collection (needed for the
"find nearby providers" feature) and get every returned provider's Expo
push token — the same token `sendPushNotification` uses to fire a push
directly, since there's no backend brokering delivery. Rules can restrict
which *documents* are readable, not which *fields within an allowed
document* are readable, so this can't be closed without either (a) moving
`pushToken` into a private subcollection only the owner can read — which
then means the client can no longer notify that provider at all, defeating
the point — or (b) a Cloud Function that reads the token server-side and
sends the push, so no client ever sees another user's token. (b) is the
real fix; it needs Blaze. Documented in `firestore.rules` directly above
the `providers` rule so it isn't silently forgotten.

**National ID encryption key ships inside the app bundle.** Unchanged from
before — `idCrypto.ts` already documents this honestly. It protects the ID
at rest in Firestore against casual DB access, not against someone
decompiling the installed app. A real fix means moving encryption
server-side (again, needs a backend/Cloud Function).

**Still no automated tests.** None added. `pricing.ts` and the new
transition table in `requests.ts` are the two highest-value places to
start — both are pure functions/logic with no Firestore or RN dependency,
so they're cheap to unit test.
