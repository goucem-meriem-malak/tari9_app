# Tari9 - changes this session

## 1. Install one new package
```
npx expo install @react-native-community/netinfo
```
That's it - everything else reuses what was already in the project.

## 2. UI/UX: dropdowns instead of button pills
- `src/components/SelectDropdown.tsx` (new) - reusable tap-to-open dropdown
  (closed field -> bottom-sheet list with a checkmark on the current pick).
  Used by both the request-details form and the new saved-vehicle picker,
  so there's one dropdown component in the whole app, not two.
- `src/screens/RequestDetailsScreen.tsx` - `select` fields (vehicle type,
  fuel type) now render via `SelectDropdown` instead of a wrapping row of
  buttons. Matters more now that there are 10 vehicle types and 5 fuel
  types instead of 3 and 2.
- `src/config/serviceTypes.ts` - vehicle types widened from 3 -> 10 (Car,
  SUV/4x4, Motorcycle, Van/Minibus, Pickup, Truck, Bus, Tricycle, Tractor,
  Other), shared across mechanic/tow/garage via one exported
  `VEHICLE_TYPE_OPTIONS` instead of copy-pasted per service. Fuel types
  widened from 2 -> 5 (Petrol Normale/Super, Diesel, GPL, Engine Oil) -
  `unitPrice`s are still placeholders, swap for your real per-liter numbers.

## 3. Offline resilience (the stuck-loading bug)
Root cause: Firestore's `onSnapshot` listeners don't error out on plain
connectivity loss - with no cached data yet they just sit pending forever,
which is what was leaving screens (provider search especially) spinning
with zero explanation.
- `src/hooks/useNetworkStatus.ts` (new) - live connectivity state via
  NetInfo, independent of whether any Firestore callback ever fires.
- `src/components/OfflineBanner.tsx` (new) + wired into
  `RootNavigator.tsx` - a persistent "you're offline" banner visible on
  every screen, sign-in included. Disappears the instant you reconnect.
- `src/screens/ProviderListScreen.tsx` - the provider-search spinner now
  also resolves on "we're definitely offline" (not just on a Firestore
  callback), shows a clear inline message instead of an empty list, and the
  "send request" action is guarded so tapping a provider while offline
  shows an alert instead of hanging on "Sending your request...".
- `src/screens/RequestStatusScreen.tsx` - the "Loading request..." state
  now says so when it's actually a connectivity issue.
- `src/screens/ProfileScreen.tsx` - `handleSave` now has a try/catch
  (previously an offline save would throw with no feedback at all).
- Already-loaded screens keep working from Firestore's in-memory cache
  while the app stays open - that part didn't need any change, the JS SDK
  already does it. What was missing was *telling the user* what's going on
  when a screen has nothing cached yet.
- Known limit, unchanged: the app still can't match a live nearby provider
  with zero connectivity - no app like this can. The goal was "never
  freezes, always says what's going on", not full offline functionality.

## 4. Saved vehicle profile (list of up to 3)
- `src/types/index.ts` - new `SavedVehicle { id, vehicleType, makeModel }`,
  `AppUser.vehicles?: SavedVehicle[]`.
- `src/screens/ProfileScreen.tsx` - "My Vehicles" section: add (type +
  make/model via the shared dropdown) and remove, capped at 3, persisted
  together with the rest of the profile on "Save Changes" (same pattern the
  screen already used for name/phone/ID).
- `src/screens/RequestDetailsScreen.tsx` - when the picked service asks for
  a vehicle (mechanic/tow/garage) and the client has saved vehicles, a
  "Use a saved vehicle" chip row appears above the fields - tapping one
  fills both `vehicleType` and `vehicleMakeModel` in one go. Still fully
  editable per request afterward.

## 5. National ID: "Verified" badge, never the number
This was mostly already true from last session (the provider-facing
`ServiceRequest` type never carried the ID at all) - what was missing was
actually telling the provider that a client's ID is on file.
- `src/types/index.ts` - `ServiceRequest.clientIdVerified?: boolean`. This
  is the *only* id-related thing that ever reaches a request doc.
- `src/screens/ProviderListScreen.tsx` - sets `clientIdVerified: !!appUser?.nationalId`
  when creating the request (presence check only - never reads or decrypts
  the value itself here).
- `src/screens/worker/WorkerDashboardScreen.tsx` and
  `WorkerHistoryScreen.tsx` - a small "✓ Verified" badge next to the
  client's name when `clientIdVerified` is true. No number, ever - the
  encrypted value still only ever gets decrypted client-side, on that same
  client's own Profile screen.
