import { PricingRule } from '@/config/serviceTypes';

/**
 * Same tiered formula as the original app (price = distance * rate + base,
 * with a higher base fee past a distance threshold), just parametrized
 * per service type instead of hardcoded per Activity.
 */
export function calculatePrice(distanceMeters: number, rule: PricingRule): number {
  const base =
    distanceMeters <= rule.nearThresholdMeters ? rule.nearBaseFee : rule.farBaseFee;
  const price = distanceMeters * rule.perMeterRate + base;
  return Math.round(price);
}
