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

/** One entry in a client's saved-vehicle list (max 3, enforced in ProfileScreen). */
export interface SavedVehicle {
  id: string;
  /** Matches an ExtraFieldOption.value from VEHICLE_TYPE_OPTIONS in config/serviceTypes.ts */
  vehicleType: string;
  makeModel: string;
}

export interface AppUser {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  /** AES ciphertext only - never store or send the plain ID. */
  nationalId?: string;
  /** Up to 3 - quick-fills vehicleType/vehicleMakeModel on mechanic/tow/garage requests. */
  vehicles?: SavedVehicle[];
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
  /**
   * NOT on this doc/type - the browsable 'providers/{id}' doc is
   * readable by any signed-in client, so the token lives in the
   * separate 'providers/{id}/private/contact' doc instead (see
   * firestore.rules and push.ts::getProviderPushToken). Deliberately
   * omitted here so nothing accidentally re-attaches it to a provider
   * write and violates the rules' pushToken guard.
   */
  /** Client-side only, computed after fetch - not stored in Firestore */
  distanceMeters?: number;
}

export type RequestState =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'completed'
  | 'cancelled';

/**
 * No real gateway yet (see docs Section 8.2) - this is the groundwork:
 * a client picks a method and the request records what was chosen and
 * whether it's been settled. 'card' currently just simulates a charge
 * client-side; wiring a real processor (mada/Apple Pay/STC Pay) later
 * only means swapping what happens inside PaymentScreen's "pay now"
 * handler, not this data model.
 */
// 'card' = generic Visa/Mastercard. 'edahabia' = Algérie Poste / CIB rail
// (Algeria). 'mada' = Saudi domestic debit network. 'stcpay' = STC Pay
// wallet (Saudi). All non-cash methods share the same simulated card-entry
// form in PaymentScreen - see the note there.
export type PaymentMethod = 'cash' | 'card' | 'edahabia' | 'mada' | 'stcpay';
export type PaymentStatus = 'unpaid' | 'paid';

export interface ServiceRequest {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  clientPushToken?: string;
  /**
   * True if the client has a national ID on file at request time. This is
   * the ONLY id-related thing that ever reaches a request doc - the encrypted
   * value itself lives solely on the client's own user doc (see AppUser) and
   * is decrypted only for that same client viewing their own Profile screen.
   * Providers see a "✓ Verified" badge, never a number.
   */
  clientIdVerified?: boolean;
  providerId: string | null;
  providerPhone?: string;
  providerName?: string;
  type: ServiceTypeId;
  state: RequestState;
  clientLocation: GeoPoint;
  providerLocation?: GeoPoint;
  address: Address;
  price: number;
  /** itemCost (e.g. fuel) + deliveryCost - present once the flow adds priced extras */
  priceBreakdown?: { itemCost: number; deliveryCost: number };
  distanceMeters: number;
  /** Generic per-service answers, keyed by ExtraFieldConfig.key (see config/serviceTypes.ts) */
  extra?: Record<string, string | number>;
  createdAt: number;
  updatedAt: number;
  /**
   * Settled once the job is 'completed' - see PaymentScreen. Absent on
   * older/unpaid requests, which the UI treats the same as 'unpaid'.
   */
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAt?: number;
}
