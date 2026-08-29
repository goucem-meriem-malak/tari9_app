import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ServiceTypeId } from '@/config/serviceTypes';
import { Provider, GeoPoint } from '@/types';
import { getDistanceMeters } from '@/utils/distance';

/**
 * Live-subscribes to all available providers of one type, sorted by
 * distance from the client. This ONE function replaces the six original
 * get_list_free_mechanics()-style methods duplicated across
 * list_mechanics.java, list_garage.java, list_taxis.java, list_tows.java,
 * list_ambulance.java, and list_stations.java.
 *
 * Returns an unsubscribe function - call it on screen unmount.
 */
export function subscribeToNearbyProviders(
  type: ServiceTypeId,
  clientLocation: GeoPoint,
  onUpdate: (providers: Provider[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    collection(db, 'providers'),
    where('type', '==', type),
    where('available', '==', true)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const providers: Provider[] = snapshot.docs.map((d) => {
        const data = d.data() as Omit<Provider, 'id' | 'distanceMeters'>;
        return {
          ...data,
          id: d.id,
          distanceMeters: getDistanceMeters(clientLocation, data.location),
        };
      });
      providers.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
      onUpdate(providers);
    },
    (err) => onError?.(err)
  );
}
