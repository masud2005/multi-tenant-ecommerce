import { coupons, COD_FEE, type Coupon } from '../data/shipping';
import type { Product, Variant } from '../types/commerce';

export function variantPrice(v: Variant) {
  return v.salePrice ?? v.price;
}

export function productPrice(p: Product) {
  return p.salePrice ?? p.price;
}

export function discountPercent(p: Product) {
  if (!p.salePrice) return 0;
  return Math.round(((p.price - p.salePrice) / p.price) * 100);
}

export function available(v: Variant) {
  return Math.max(0, v.stock - v.reserved);
}

export function productStock(p: Product) {
  return p.variants.filter((v) => v.enabled).reduce((s, v) => s + available(v), 0);
}

export type StockState = 'in_stock' | 'low' | 'out' | 'preorder';

export const LOW_STOCK_THRESHOLD = 5;

export function variantStockState(p: Product, v?: Variant): StockState {
  if (p.preorder) return 'preorder';
  const qty = v ? available(v) : productStock(p);
  if (qty <= 0) return 'out';
  if (qty <= LOW_STOCK_THRESHOLD) return 'low';
  return 'in_stock';
}

export function findCoupon(code: string): Coupon | undefined {
  return coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
}

export function couponDiscount(coupon: Coupon | undefined, subtotal: number) {
  if (!coupon) return 0;
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  if (coupon.type === 'percent') return Math.round((subtotal * coupon.value) / 100);
  if (coupon.type === 'fixed') return Math.min(coupon.value, subtotal);
  return 0;
}

export function orderTotals(opts: {
  subtotal: number;
  coupon?: Coupon;
  shipping: number;
  cod: boolean;
}) {
  const discount = couponDiscount(opts.coupon, opts.subtotal);
  const shipping = opts.coupon?.type === 'free_shipping' ? 0 : opts.shipping;
  const codFee = opts.cod ? COD_FEE : 0;
  const total = opts.subtotal - discount + shipping + codFee;
  return { discount, shipping, codFee, total };
}
