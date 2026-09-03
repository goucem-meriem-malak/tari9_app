# Tari9 - Payment established (this patch)

This is a partial-update zip: only the files touched to add payment are
included. Drop these into your existing project, overwriting the same
paths - everything else is untouched.

## Scope
Payment method selection (cash / card) + status tracking on the request,
plus a mock "Pay Now" screen that simulates a successful card charge.
No real gateway (mada/Apple Pay/STC Pay) yet - that needs live API keys
and, per the docs, ideally a Cloud Function to charge server-side rather
than trusting the client. This patch is the groundwork: the data model,
rules, and UI flow are all in place so swapping in a real processor
later is a change to one function, not a redesign.

## When payment happens
After a request reaches `completed` - client taps "Pay Now" on the
Request Status screen, which opens the new Payment screen.

## Files
- `src/types/index.ts` - new `PaymentMethod` ('cash' | 'card'),
  `PaymentStatus` ('unpaid' | 'paid'); `ServiceRequest` gets
  `paymentMethod?`, `paymentStatus?`, `paidAt?`.
- `src/services/requests.ts` - new `payForRequest(requestId, method)`:
  guarded transaction, only works once the job is `completed` and only
  once (throws if already paid).
- `firestore.rules` - new `isValidPaymentUpdate()`: client-only, job
  must already be `completed`, state itself doesn't change, and a
  request can only be marked paid once. Wired into the existing
  `allow update` alongside `isValidTransition()`. **Deploy this
  alongside the app code** (`firebase deploy --only firestore:rules`)
  or `payForRequest` will fail with permission-denied.
- `src/navigation/types.ts` / `RootNavigator.tsx` - new `Payment` route.
- `src/screens/PaymentScreen.tsx` (new) - method picker (cash/card) +
  pay button. Cash confirms instantly; card simulates a ~1.4s
  "processing" delay then succeeds - no real network call.
- `src/screens/RequestStatusScreen.tsx` - "Pay Now" button when a
  request is completed and unpaid; a "Paid (method)" badge once paid.
- `src/screens/worker/WorkerHistoryScreen.tsx` - Paid/Unpaid badge on
  the provider's completed-job rows, so a provider can see at a glance
  whether a cash job still needs collecting.
- `src/screens/RequestHistoryScreen.tsx` - the client's own history list.
  A completed-and-unpaid row is now tappable ("Unpaid - tap to pay") and
  opens the Payment screen for that request. This is the piece that was
  missing before: "Pay Now" only ever showed up on the live Request
  Status screen right after sending a request, so a client who'd already
  left that screen by the time the job was marked completed had no way
  back to pay. This closes that gap.
- `src/i18n/locales/en.ts`, `ar.ts` - new `payment.*` strings, plus a
  few additions to `requestStatus.*`, `workerHistory.*`, `nav.*`.

## Still open (unchanged from the docs' Section 8.2/8.4)
- No real payment gateway - nothing here actually moves money.
- No server-side price re-validation - still a client-computed `price`,
  same known gap as before this patch.
- No commission/revenue model wired to any of this yet.
