import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ServiceRequest } from '@/types';

export async function createRequest(
  request: Omit<ServiceRequest, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, 'requests'), request);
  return ref.id;
}

export async function cancelRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'requests', requestId));
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

export async function updateRequestState(
  requestId: string,
  state: ServiceRequest['state']
): Promise<void> {
  await updateDoc(doc(db, 'requests', requestId), {
    state,
    updatedAt: Date.now(),
  });
}
