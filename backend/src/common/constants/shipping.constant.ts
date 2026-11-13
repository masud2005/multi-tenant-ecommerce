/** Default delivery rates seeded for every new store (Admin → Shipping). */
export const DEFAULT_STORE_SHIPPING: {
  insideDhaka: number;
  outsideDhaka: number;
  freeDeliveryThreshold: number;
  insideDhakaEst: string;
  outsideDhakaEst: string;
  pickup: boolean;
} = {
  insideDhaka: 70,
  outsideDhaka: 150,
  freeDeliveryThreshold: 2500,
  insideDhakaEst: '1–2 business days',
  outsideDhakaEst: '2–4 business days',
  pickup: false,
};

export type DefaultStoreShipping = typeof DEFAULT_STORE_SHIPPING;

/** Fill missing shipping keys only — never overwrite an explicit admin value (including 0). */
export function mergeStoreShippingDefaults(
  raw?: Record<string, unknown> | null,
): DefaultStoreShipping {
  const sh = raw && typeof raw === 'object' ? raw : {};

  const num = (v: unknown, fallback: number) => {
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) return n;
    }
    return fallback;
  };

  const str = (v: unknown, fallback: string) =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;

  return {
    insideDhaka: num(sh.insideDhaka, DEFAULT_STORE_SHIPPING.insideDhaka),
    outsideDhaka: num(sh.outsideDhaka, DEFAULT_STORE_SHIPPING.outsideDhaka),
    freeDeliveryThreshold: num(
      sh.freeDeliveryThreshold ?? sh.freeShippingThreshold,
      DEFAULT_STORE_SHIPPING.freeDeliveryThreshold,
    ),
    insideDhakaEst: str(
      sh.insideDhakaEst,
      DEFAULT_STORE_SHIPPING.insideDhakaEst,
    ),
    outsideDhakaEst: str(
      sh.outsideDhakaEst,
      DEFAULT_STORE_SHIPPING.outsideDhakaEst,
    ),
    pickup:
      typeof sh.pickup === 'boolean'
        ? sh.pickup
        : DEFAULT_STORE_SHIPPING.pickup,
  };
}
