/**
 * Single source of truth for every service Tari9 offers.
 *
 * This file is the whole point of the refactor: the original Android app had
 * six near-identical Activities (list_mechanics, list_garage, list_taxis,
 * list_tows, list_ambulance, list_stations) each hardcoding one collection
 * name and one pricing rule. Here, adding a 7th service type - or a new
 * question a provider needs answered before accepting - is an entry below,
 * not a new screen.
 */

export type ServiceTypeId =
  | 'mechanic'
  | 'tow'
  | 'taxi'
  | 'ambulance'
  | 'garage'
  | 'station';

export interface PricingRule {
  /** Distance (m) at/under which the lower base fee applies */
  nearThresholdMeters: number;
  nearBaseFee: number;
  farBaseFee: number;
  /** Currency units per meter of distance */
  perMeterRate: number;
}

export type ExtraFieldType = 'text' | 'textarea' | 'number' | 'select';

export interface ExtraFieldOption {
  value: string;
  label: string;
  /** Only used when this option is picked by a field another field is `pricedBy`. */
  unitPrice?: number;
}

export interface ExtraFieldConfig {
  /** Storage key inside ServiceRequest.extra */
  key: string;
  label: string;
  type: ExtraFieldType;
  required?: boolean;
  placeholder?: string;
  /** Required for type 'select' */
  options?: ExtraFieldOption[];
  /**
   * For a 'number' field: the key of a 'select' field in the same service
   * whose chosen option's unitPrice multiplies this field's value to
   * produce an item cost (e.g. quantity * price-per-liter for fuel).
   */
  pricedBy?: string;
  /** Unit label shown next to a number field, e.g. "liters" */
  unit?: string;
}

export interface ServiceTypeConfig {
  id: ServiceTypeId;
  label: string;
  icon: string; // emoji placeholder - swap for a real icon set later
  description: string;
  /** Extra questions this service's request form should collect */
  extraFields?: ExtraFieldConfig[];
  pricing: PricingRule;
  /**
   * 'exact': show the computed price as a firm number, client and provider both see it.
   * 'estimateOnly': show it as a rough call-out estimate - final price is
   * agreed directly between client and provider once the provider sees the
   * issue (e.g. a mechanic can't price a repair sight-unseen).
   */
  pricingDisplay: 'exact' | 'estimateOnly';
}

// Shared across mechanic / tow / garage so the list only needs updating in
// one place. Widened from the original 3 options to cover what actually
// shows up on the road. Exported so the saved-vehicle picker in ProfileScreen
// reuses the exact same list instead of a second hardcoded copy.
export const VEHICLE_TYPE_OPTIONS: ExtraFieldOption[] = [
  { value: 'car', label: 'Car' },
  { value: 'suv_4x4', label: 'SUV / 4x4' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'van_minibus', label: 'Van / Minibus' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'truck', label: 'Truck' },
  { value: 'bus', label: 'Bus' },
  { value: 'tricycle', label: 'Tricycle (Triporteur)' },
  { value: 'tractor', label: 'Tractor / Agricultural' },
  { value: 'other', label: 'Other' },
];

function vehicleTypeField(): ExtraFieldConfig {
  return {
    key: 'vehicleType',
    label: 'Vehicle type',
    type: 'select',
    required: true,
    options: VEHICLE_TYPE_OPTIONS,
  };
}

function vehicleMakeModelField(): ExtraFieldConfig {
  return {
    key: 'vehicleMakeModel',
    label: 'Make & model',
    type: 'text',
    required: true,
    placeholder: 'e.g. Renault Symbol',
  };
}

export const SERVICE_TYPES: ServiceTypeConfig[] = [
  {
    id: 'mechanic',
    label: 'Mechanic',
    icon: '🔧',
    description: 'On-site repair for breakdowns',
    extraFields: [
      vehicleTypeField(),
      vehicleMakeModelField(),
      {
        key: 'issueDescription',
        label: 'Describe the issue',
        type: 'textarea',
        required: true,
        placeholder: "What's wrong with the vehicle? Be as specific as you can.",
      },
    ],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 350, farBaseFee: 500, perMeterRate: 2 },
    pricingDisplay: 'estimateOnly',
  },
  {
    id: 'tow',
    label: 'Tow Truck',
    icon: '🚛',
    description: 'Vehicle towing to a garage',
    extraFields: [vehicleTypeField(), vehicleMakeModelField()],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 500, farBaseFee: 700, perMeterRate: 2.5 },
    pricingDisplay: 'exact',
  },
  {
    id: 'taxi',
    label: 'Taxi',
    icon: '🚕',
    description: 'Passenger pickup and ride',
    extraFields: [
      {
        key: 'passengerCount',
        label: 'Passengers',
        type: 'number',
        required: true,
        unit: 'people',
      },
    ],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 150, farBaseFee: 250, perMeterRate: 1 },
    pricingDisplay: 'exact',
  },
  {
    id: 'ambulance',
    label: 'Ambulance',
    icon: '🚑',
    description: 'Emergency medical transport',
    extraFields: [
      {
        key: 'injuredCount',
        label: 'Number of injured',
        type: 'number',
        required: true,
        unit: 'people',
      },
    ],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 400, farBaseFee: 400, perMeterRate: 1.5 },
    pricingDisplay: 'exact',
  },
  {
    id: 'garage',
    label: 'Garage',
    icon: '🏚️',
    description: 'Fixed-location repair shop',
    extraFields: [
      vehicleTypeField(),
      vehicleMakeModelField(),
      {
        key: 'issueDescription',
        label: 'Describe the issue',
        type: 'textarea',
        required: true,
        placeholder: "What's wrong with the vehicle? Be as specific as you can.",
      },
    ],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 300, farBaseFee: 450, perMeterRate: 2 },
    pricingDisplay: 'estimateOnly',
  },
  {
    id: 'station',
    label: 'Fuel Delivery',
    icon: '⛽',
    description: 'Fuel or oil brought to you',
    extraFields: [
      {
        key: 'fuelType',
        label: 'Fuel type',
        type: 'select',
        required: true,
        // Widened from petrol/diesel only - swap unitPrice for your real
        // per-liter numbers, these are placeholders like before.
        options: [
          { value: 'petrol_normal', label: 'Petrol - Normale', unitPrice: 45 },
          { value: 'petrol_super', label: 'Petrol - Super (Sans Plomb)', unitPrice: 47 },
          { value: 'diesel', label: 'Diesel (Gasoil)', unitPrice: 30 },
          { value: 'gpl', label: 'GPL / Auto Gas (Sirghaz)', unitPrice: 25 },
          { value: 'engine_oil', label: 'Engine Oil (Huile moteur)', unitPrice: 800 },
        ],
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'number',
        required: true,
        unit: 'liters',
        pricedBy: 'fuelType',
      },
    ],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 300, farBaseFee: 450, perMeterRate: 1.8 },
    pricingDisplay: 'exact',
  },
];

export function getServiceType(id: ServiceTypeId): ServiceTypeConfig {
  const found = SERVICE_TYPES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown service type: ${id}`);
  return found;
}
