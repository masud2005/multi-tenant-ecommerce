import type { CartItem, ReturnRequest, ReturnStatus } from '@/types/commerce';

export const now = () => new Date().toISOString();

export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('tanti.cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out old seed/mock items that start with 'p0' or 'p1'
    return parsed.filter(
      (item: CartItem) => item?.productId && !item.productId.match(/^p0[0-9]|^p1[0-9]/)
    );
  } catch {
    return [];
  }
}

export function loadWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('tanti.wishlist');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (id: string) => typeof id === 'string' && !id.match(/^p0[0-9]|^p1[0-9]/)
    );
  } catch {
    return [];
  }
}

export function returnEventLabel(status: ReturnStatus, r: ReturnRequest): string {
  switch (status) {
    case 'approved':
      return r.resolution === 'exchange'
        ? 'Exchange approved — pickup scheduled'
        : 'Return approved — pickup scheduled';
    case 'rejected':
      return 'Return rejected';
    case 'in_transit':
      return 'Picked up by courier';
    case 'received':
      return 'Item received at warehouse';
    case 'refunded':
      return r.resolution === 'store_credit'
        ? `Store credit of ৳${r.amount.toLocaleString('en-IN')} issued`
        : `Refund of ৳${r.amount.toLocaleString('en-IN')} issued`;
    case 'exchanged':
      return 'Replacement shipped';
    default:
      return status;
  }
}
