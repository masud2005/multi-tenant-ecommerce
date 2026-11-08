/** Live store shipping config from Admin → Shipping (tenant.settings.shipping) */

export type StoreShippingSettings = {
  insideDhaka: number;
  outsideDhaka: number;
  freeDeliveryThreshold: number;
  insideDhakaEst: string;
  outsideDhakaEst: string;
  pickup: boolean;
};

/** Matches backend DEFAULT_STORE_SHIPPING (seeded for every store). */
export const EMPTY_STORE_SHIPPING: StoreShippingSettings = {
  insideDhaka: 70,
  outsideDhaka: 150,
  freeDeliveryThreshold: 2500,
  insideDhakaEst: '1–2 business days',
  outsideDhakaEst: '2–4 business days',
  pickup: false,
};

export function parseStoreShipping(raw: unknown): StoreShippingSettings {
  const sh = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown, fallback: number) => {
    if (v === undefined || v === null || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };
  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;

  return {
    insideDhaka: num(sh.insideDhaka, EMPTY_STORE_SHIPPING.insideDhaka),
    outsideDhaka: num(sh.outsideDhaka, EMPTY_STORE_SHIPPING.outsideDhaka),
    freeDeliveryThreshold: num(
      sh.freeDeliveryThreshold ?? sh.freeShippingThreshold,
      EMPTY_STORE_SHIPPING.freeDeliveryThreshold
    ),
    insideDhakaEst: str(sh.insideDhakaEst, EMPTY_STORE_SHIPPING.insideDhakaEst),
    outsideDhakaEst: str(sh.outsideDhakaEst, EMPTY_STORE_SHIPPING.outsideDhakaEst),
    pickup: typeof sh.pickup === 'boolean' ? sh.pickup : EMPTY_STORE_SHIPPING.pickup,
  };
}

export function isInsideDhakaDistrict(district: string) {
  return (district || '').trim().toLowerCase() === 'dhaka';
}

/** Delivery fee for a district given live admin rates + free-delivery threshold */
export function storeDeliveryFee(
  shipping: StoreShippingSettings,
  district: string,
  subtotal: number
): number {
  const freeUnlocked =
    shipping.freeDeliveryThreshold > 0 &&
    subtotal >= shipping.freeDeliveryThreshold;
  if (freeUnlocked) return 0;
  return isInsideDhakaDistrict(district)
    ? shipping.insideDhaka
    : shipping.outsideDhaka;
}

export function storeDeliveryEstimate(
  shipping: StoreShippingSettings,
  district: string,
  method: 'standard' | 'pickup' = 'standard'
): string {
  if (method === 'pickup') return 'Ready today';
  return isInsideDhakaDistrict(district)
    ? shipping.insideDhakaEst
    : shipping.outsideDhakaEst;
}
