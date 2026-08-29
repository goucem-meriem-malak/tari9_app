import { ServiceTypeId } from '@/config/serviceTypes';

export type UserRole = 'client' | 'worker';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Address {
  raw: string;
  city?: string;
  country?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  address?: Address;
  location?: GeoPoint;
  pushToken?: string;
  createdAt: number;
}

export interface Provider {
  id: string;
  /** Firebase Auth uid of the worker who owns this provider profile - one-to-one */
  ownerUid: string;
  type: ServiceTypeId;
  name: string;
  phone: string;
  location: GeoPoint;
  address: Address;
  available: boolean;
  rating?: number;
  pushToken?: string;
  /** Client-side only, computed after fetch - not stored in Firestore */
  distanceMeters?: number;
}

export type RequestState =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  clientPushToken?: string;
  providerId: string | null;
  providerPhone?: string;
  providerName?: string;
  type: ServiceTypeId;
  state: RequestState;
  clientLocation: GeoPoint;
  providerLocation?: GeoPoint;
  address: Address;
  price: number;
  distanceMeters: number;
  extra?: {
    fuelType?: string;
    oilType?: string;
    passengerCount?: number;
    vehicleInfo?: string;
  };
  createdAt: number;
  updatedAt: number;
}
