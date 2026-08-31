import { PricingRule, ServiceTypeConfig } from '@/config/serviceTypes';

/**
 * Same tiered formula as the original app (price = distance * rate + base,
 * with a higher base fee past a distance threshold), just parametrized
 * per service type instead of hardcoded per Activity. This is the
 * "delivery / call-out" side of the price - always distance-based.
 */
export function calculateDeliveryCost(distanceMeters: number, rule: PricingRule): number {
  const base =
    distanceMeters <= rule.nearThresholdMeters ? rule.nearBaseFee : rule.farBaseFee;
  const price = distanceMeters * rule.perMeterRate + base;
  return Math.round(price);
}

/** @deprecated use calculateDeliveryCost - kept so old call sites still compile */
export const calculatePrice = calculateDeliveryCost;

/**
 * The "item" side of the price - e.g. fuel cost = quantity * price-per-liter
 * for whichever fuel type was picked. Reads the pricedBy/unitPrice wiring
 * from the service config, so it works for any service without special-casing.
 * Returns 0 for services that have no priced item (mechanic, tow, taxi...).
 */
export function calculateItemCost(
  service: ServiceTypeConfig,
  extra: Record<string, string | number> | undefined
): number {
  if (!extra || !service.extraFields) return 0;
  let total = 0;
  for (const field of service.extraFields) {
    if (field.type !== 'number' || !field.pricedBy) continue;
    const quantity = Number(extra[field.key]);
    const selectedValue = extra[field.pricedBy];
    const pricedByField = service.extraFields.find((f) => f.key === field.pricedBy);
    const option = pricedByField?.options?.find((o) => o.value === selectedValue);
    if (Number.isFinite(quantity) && option?.unitPrice != null) {
      total += quantity * option.unitPrice;
    }
  }
  return Math.round(total);
}

export interface PriceBreakdown {
  itemCost: number;
  deliveryCost: number;
  total: number;
}

/** Full breakdown for a request: item cost (if any) + delivery cost. */
export function calculateFullPrice(
  service: ServiceTypeConfig,
  distanceMeters: number,
  extra: Record<string, string | number> | undefined
): PriceBreakdown {
  const itemCost = calculateItemCost(service, extra);
  const deliveryCost = calculateDeliveryCost(distanceMeters, service.pricing);
  return { itemCost, deliveryCost, total: itemCost + deliveryCost };
}
