import { create } from 'zustand';
import { ServiceTypeId } from '@/config/serviceTypes';
import { GeoPoint, Address } from '@/types';

/**
 * Holds the in-progress request flow as the user moves across screens:
 * pick service -> pick location -> fill extra details -> pick provider -> confirm.
 * Mirrors the extras the original app passed between Activities via
 * Intent.putExtra(...), but as shared state instead of re-fetching or
 * re-passing the same fields at every navigation step.
 */
interface RequestFlowState {
  serviceType: ServiceTypeId | null;
  location: GeoPoint | null;
  address: Address | null;
  extra: Record<string, string | number>;
  activeRequestId: string | null;
  setServiceType: (t: ServiceTypeId) => void;
  setLocation: (loc: GeoPoint, address: Address) => void;
  setExtra: (extra: Record<string, string | number>) => void;
  setActiveRequestId: (id: string | null) => void;
  /**
   * Switches to a different service but keeps the current location/address -
   * used for the ambulance <-> taxi cross-suggestion, so the client doesn't
   * have to re-pick a pin on the map for the second request.
   */
  startFollowUp: (t: ServiceTypeId) => void;
  reset: () => void;
}

export const useRequestStore = create<RequestFlowState>((set) => ({
  serviceType: null,
  location: null,
  address: null,
  extra: {},
  activeRequestId: null,
  setServiceType: (t) => set({ serviceType: t }),
  setLocation: (loc, address) => set({ location: loc, address }),
  setExtra: (extra) => set({ extra }),
  setActiveRequestId: (id) => set({ activeRequestId: id }),
  startFollowUp: (t) => set({ serviceType: t, extra: {}, activeRequestId: null }),
  reset: () => set({ serviceType: null, location: null, address: null, extra: {}, activeRequestId: null }),
}));
