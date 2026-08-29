import { create } from 'zustand';
import { ServiceTypeId } from '@/config/serviceTypes';
import { GeoPoint, Address } from '@/types';

/**
 * Holds the in-progress request flow as the user moves across screens:
 * pick service -> pick location -> pick provider -> confirm.
 * Mirrors the extras the original app passed between Activities via
 * Intent.putExtra(...), but as shared state instead of re-fetching or
 * re-passing the same fields at every navigation step.
 */
interface RequestFlowState {
  serviceType: ServiceTypeId | null;
  location: GeoPoint | null;
  address: Address | null;
  activeRequestId: string | null;
  setServiceType: (t: ServiceTypeId) => void;
  setLocation: (loc: GeoPoint, address: Address) => void;
  setActiveRequestId: (id: string | null) => void;
  reset: () => void;
}

export const useRequestStore = create<RequestFlowState>((set) => ({
  serviceType: null,
  location: null,
  address: null,
  activeRequestId: null,
  setServiceType: (t) => set({ serviceType: t }),
  setLocation: (loc, address) => set({ location: loc, address }),
  setActiveRequestId: (id) => set({ activeRequestId: id }),
  reset: () => set({ serviceType: null, location: null, address: null, activeRequestId: null }),
}));
