import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Provider } from '@/types';
import { ServiceTypeId } from '@/config/serviceTypes';

/**
 * A worker's provider profile is stored with its Firestore doc ID equal to
 * their Firebase Auth uid - one worker account, one provider listing.
 * This keeps lookups trivial (no query needed, just doc(providers, uid))
 * and avoids a second "which provider belongs to this worker" index.
 */

export async function getProviderProfile(ownerUid: string): Promise<Provider | null> {
  const snap = await getDoc(doc(db, 'providers', ownerUid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Provider) : null;
}

export async function createProviderProfile(
  ownerUid: string,
  data: {
    type: ServiceTypeId;
    name: string;
    phone: string;
    location: Provider['location'];
    address: Provider['address'];
  }
): Promise<Provider> {
  const provider: Omit<Provider, 'id'> = {
    ownerUid,
    type: data.type,
    name: data.name,
    phone: data.phone,
    location: data.location,
    address: data.address,
    available: true,
  };
  await setDoc(doc(db, 'providers', ownerUid), provider);
  return { id: ownerUid, ...provider };
}

export async function updateProviderProfile(
  ownerUid: string,
  patch: Partial<Provider>
): Promise<void> {
  await updateDoc(doc(db, 'providers', ownerUid), patch);
}

export async function setProviderAvailability(
  ownerUid: string,
  available: boolean
): Promise<void> {
  await updateDoc(doc(db, 'providers', ownerUid), { available });
}
