/**
 * Single source of truth for every service Tari9 offers.
 *
 * This file is the whole point of the refactor: the original Android app had
 * six near-identical Activities (list_mechanics, list_garage, list_taxis,
 * list_tows, list_ambulance, list_stations) each hardcoding one collection
 * name and one pricing rule. Here, adding a 7th service type is one entry
 * below - not one new screen.
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

export interface ServiceTypeConfig {
  id: ServiceTypeId;
  label: string;
  icon: string; // emoji placeholder - swap for a real icon set later
  description: string;
  /** Extra fields this service's request form should collect */
  extraFields?: Array<'fuelType' | 'oilType' | 'passengerCount' | 'vehicleInfo'>;
  pricing: PricingRule;
}

export const SERVICE_TYPES: ServiceTypeConfig[] = [
  {
    id: 'mechanic',
    label: 'Mechanic',
    icon: '🔧',
    description: 'On-site repair for breakdowns',
    extraFields: ['vehicleInfo'],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 350, farBaseFee: 500, perMeterRate: 2 },
  },
  {
    id: 'tow',
    label: 'Tow Truck',
    icon: '🚛',
    description: 'Vehicle towing to a garage',
    extraFields: ['vehicleInfo'],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 500, farBaseFee: 700, perMeterRate: 2.5 },
  },
  {
    id: 'taxi',
    label: 'Taxi',
    icon: '🚕',
    description: 'Passenger pickup and ride',
    extraFields: ['passengerCount'],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 150, farBaseFee: 250, perMeterRate: 1 },
  },
  {
    id: 'ambulance',
    label: 'Ambulance',
    icon: '🚑',
    description: 'Emergency medical transport',
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 400, farBaseFee: 400, perMeterRate: 1.5 },
  },
  {
    id: 'garage',
    label: 'Garage',
    icon: '🏚️',
    description: 'Fixed-location repair shop',
    extraFields: ['vehicleInfo'],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 300, farBaseFee: 450, perMeterRate: 2 },
  },
  {
    id: 'station',
    label: 'Fuel Delivery',
    icon: '⛽',
    description: 'Fuel or oil brought to you',
    extraFields: ['fuelType', 'oilType'],
    pricing: { nearThresholdMeters: 1000, nearBaseFee: 300, farBaseFee: 450, perMeterRate: 1.8 },
  },
];

export function getServiceType(id: ServiceTypeId): ServiceTypeConfig {
  const found = SERVICE_TYPES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown service type: ${id}`);
  return found;
}
