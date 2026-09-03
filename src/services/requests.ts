import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PaymentMethod, RequestState, ServiceRequest } from '@/types';

/**
 * Creates the request doc AND, in the same batch, the activeClients
 * mirror doc under the target provider (providers/{providerId}/
 * activeClients/{clientId}) that firestore.rules checks before letting
 * this client read the provider's push token. Batched together so the
 * two can never drift out of sync - see firestore.rules for why the
 * mirror exists and how it's validated.
 */
export async function createRequest(
  request: Omit<ServiceRequest, 'id'>
): Promise<string> {
  const ref = doc(collection(db, 'requests'));
  const batch = writeBatch(db);
  batch.set(ref, request);

  if (request.providerId) {
    const mirrorRef = doc(
      db,
      'providers',
      request.providerId,
      'activeClients',
      request.clientId
    );
    batch.set(mirrorRef, { requestId: ref.id, state: 'pending' });
  }

  await batch.commit();
  return ref.id;
}

/**
 * Allowed state transitions, mirrored 1:1 from firestore.rules'
 * isValidTransition(). Keeping this list in the client too means a
 * mistaken transition fails fast with a clear error instead of a raw
 * "permission-denied" from the server, and it protects against a
 * double-tap or two devices racing to update the same request - the
 * transaction only commits if `state` is still what we expect it to be
 * the instant before we write.
 */
const ALLOWED_TRANSITIONS: Record<RequestState, RequestState[]> = {
  pending: ['accepted', 'declined', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  declined: [],
  completed: [],
  cancelled: [],
};

/**
 * Transitions a request's state, but only if it's still in a state that
 * legally allows that transition (checked inside the transaction against
 * the live server value, not whatever the client had cached). Throws if
 * the request already moved on - e.g. two providers' apps both had the
 * same request open and one already accepted it, or the client cancelled
 * it a moment before the provider tapped Accept.
 */
export async function updateRequestState(
  requestId: string,
  nextState: RequestState
): Promise<void> {
  const ref = doc(db, 'requests', requestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Request no longer exists.');
    const data = snap.data() as ServiceRequest;
    const current = data.state;
    if (!ALLOWED_TRANSITIONS[current]?.includes(nextState)) {
      throw new Error(
        `Can't move this request from "${current}" to "${nextState}" - someone else already acted on it.`
      );
    }
    tx.update(ref, { state: nextState, updatedAt: Date.now() });

    // declined/cancelled are true dead ends - drop the mirror doc that
    // grants push-token read access. 'completed' deliberately does NOT
    // drop it yet: the client still needs to read the provider's token
    // one more time to send the payment-received push once they pay -
    // see payForRequest below, which is what actually closes this out.
    const isDeadEnd = nextState === 'declined' || nextState === 'cancelled';
    if (isDeadEnd && data.providerId) {
      const mirrorRef = doc(db, 'providers', data.providerId, 'activeClients', data.clientId);
      tx.delete(mirrorRef);
    }
  });
}

/**
 * Cancelling used to hard-delete the request doc, which meant: no audit
 * trail, and a provider mid-response would just see the request vanish
 * from their list with zero explanation. It's now a normal state
 * transition to 'cancelled' - same guarded path as accept/decline/
 * complete - so the provider's live listener shows exactly what happened.
 */
export async function cancelRequest(requestId: string): Promise<void> {
  await updateRequestState(requestId, 'cancelled');
}

/**
 * Records that a completed request has been paid. Only legal once the job
 * is 'completed' and only once - mirrors isValidPaymentUpdate() in
 * firestore.rules, which is the actual enforcement point (this
 * pre-check just fails fast with a clear message instead of a raw
 * "permission-denied" from the server, same pattern as
 * updateRequestState above). No real charge happens here yet - the
 * "processing" step lives in PaymentScreen, client-side only; this just
 * writes the outcome once that step decides it succeeded.
 */
export async function payForRequest(
  requestId: string,
  method: PaymentMethod
): Promise<void> {
  const ref = doc(db, 'requests', requestId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Request no longer exists.');
    const data = snap.data() as ServiceRequest;
    if (data.state !== 'completed') {
      throw new Error("This request can't be paid yet - the job isn't marked completed.");
    }
    if (data.paymentStatus === 'paid') {
      throw new Error('This request has already been paid.');
    }
    tx.update(ref, {
      paymentMethod: method,
      paymentStatus: 'paid',
      paidAt: Date.now(),
    });

    // Payment is the actual end of this client-provider relationship -
    // drop the mirror doc now, since it was deliberately kept alive
    // through 'completed' so the client could reach this point.
    if (data.providerId) {
      const mirrorRef = doc(db, 'providers', data.providerId, 'activeClients', data.clientId);
      tx.delete(mirrorRef);
    }
  });
}

/** Live status for one request - drives the "waiting -> accepted" screen */
export function subscribeToRequest(
  requestId: string,
  onUpdate: (request: ServiceRequest | null) => void
): () => void {
  return onSnapshot(doc(db, 'requests', requestId), (snap) => {
    onUpdate(snap.exists() ? ({ id: snap.id, ...snap.data() } as ServiceRequest) : null);
  });
}

/** Full request history for the signed-in client, most recent first */
export function subscribeToClientHistory(
  clientId: string,
  onUpdate: (requests: ServiceRequest[]) => void
): () => void {
  const q = query(
    collection(db, 'requests'),
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    onUpdate(
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))
    );
  });
}

/**
 * All requests ever sent to one provider, most recent first. Screens split
 * this locally into pending / active / history buckets by `state` - avoids
 * needing three separate composite Firestore indexes for one small app.
 */
export function subscribeToProviderRequests(
  providerId: string,
  onUpdate: (requests: ServiceRequest[]) => void
): () => void {
  const q = query(
    collection(db, 'requests'),
    where('providerId', '==', providerId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    onUpdate(
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))
    );
  });
}
