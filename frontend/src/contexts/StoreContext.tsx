'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { products as seedProducts, categories as seedCategories } from '../data/products';
import { orders as seedOrders, returns as seedReturns } from '../data/orders';
import { reviews as seedReviews } from '../data/reviews';
import { customers as seedCustomers, currentUserAddresses } from '../data/customers';
import type {
  Address,
  CartItem,
  CategoryItemData,
  Customer,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ReturnRequest,
  ReturnStatus,
  Review,
  TimelineEvent
} from '../types/commerce';
import { variantPrice } from '../utils/pricing';

import { authService } from '@/services/auth';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface PlaceOrderInput {
  contact: { name: string; email: string; phone: string };
  address: Address;
  shippingMethod: string;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  discount: number;
  couponCode?: string;
  customerNote?: string;
  subtotal: number;
  total: number;
}

export interface StoreContextValue {
  products: Product[];
  orders: Order[];
  returns: ReturnRequest[];
  reviews: Review[];
  customers: Customer[];
  cart: CartItem[];
  wishlist: string[];
  compare: string[];
  recentlyViewed: string[];
  user: User | null;
  addresses: Address[];
  storeCredit: number;
  miniCartOpen: boolean;
  quickViewId: string | null;
  compareOpen: boolean;
  searchOpen: boolean;
  setMiniCartOpen: (v: boolean) => void;
  setQuickViewId: (id: string | null) => void;
  setCompareOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  addToCart: (productId: string, variantId: string, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  changeVariant: (key: string, variantId: string) => void;
  removeFromCart: (key: string) => void;
  toggleSaveForLater: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  toggleCompare: (productId: string) => void;
  trackView: (productId: string) => void;
  login: (email: string) => void;
  register: (u: Omit<User, 'id'>) => void;
  logout: () => void;
  saveAddress: (a: Address) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  placeOrder: (input: PlaceOrderInput) => Order;
  completePayment: (orderId: string, result: 'success' | 'fail' | 'cancel') => void;
  retryPayment: (orderId: string, method: PaymentMethod) => void;
  setOrderStatus: (orderId: string, status: OrderStatus, event?: Partial<TimelineEvent> & { courier?: string; tracking?: string }) => void;
  addOrderNote: (orderId: string, text: string, internal: boolean, by: string) => void;
  refundOrder: (orderId: string, amount: number, by: string, reason: string) => void;
  markCodCollected: (orderId: string, by: string) => void;
  cancelOrder: (orderId: string, by: string) => void;
  createReturn: (r: Omit<ReturnRequest, 'id' | 'createdAt' | 'timeline' | 'status'>) => ReturnRequest;
  updateReturn: (id: string, status: ReturnStatus, by: string, note?: string) => void;
  saveProduct: (p: Product) => void;
  adjustStock: (productId: string, variantId: string, delta: number) => void;
  updateReview: (id: string, patch: Partial<Review>) => void;
  addReview: (r: Omit<Review, 'id' | 'date' | 'status' | 'helpful'>) => void;
  categories: CategoryItemData[];
  addCategory: (c: CategoryItemData) => void;
  saveCategory: (key: string, patch: Partial<CategoryItemData>) => void;
  deleteCategory: (key: string) => void;
  addSubcategory: (categoryKey: string, subcategoryName: string) => void;
  removeSubcategory: (categoryKey: string, subcategoryName: string) => void;
  renameSubcategory: (categoryKey: string, oldName: string, newName: string) => void;
  toggleCustomerStatus: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);


function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const now = () => new Date().toISOString();

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() =>
    load('tanti.products', seedProducts)
  );
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [returns, setReturns] = useState<ReturnRequest[]>(seedReturns);
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [customers, setCustomers] = useState<Customer[]>(seedCustomers);
  const [cart, setCart] = useState<CartItem[]>(() =>
    load('tanti.cart', [
      { key: 'p03-0-l', productId: 'p03', variantId: 'p03-0-l', qty: 1 },
      { key: 'p08-0-one-size', productId: 'p08', variantId: 'p08-0-one-size', qty: 1 }
    ])
  );
  const [wishlist, setWishlist] = useState<string[]>(() => load('tanti.wishlist', ['p02', 'p05', 'p11']));
  const [compare, setCompare] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(['p10', 'p06']);
  const [categories, setCategories] = useState<CategoryItemData[]>(() =>
    load('tanti.categories', seedCategories as CategoryItemData[])
  );
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = authService.getStoredUser();
    if (stored) {
      return {
        id: stored.id,
        name: stored.name || stored.email?.split('@')[0] || 'User',
        email: stored.email,
        phone: stored.phone || '',
        role: stored.role,
      };
    }
    return null;
  });

  // Re-sync session state on mount
  useEffect(() => {
    const stored = authService.getStoredUser();
    if (stored) {
      setUser({
        id: stored.id,
        name: stored.name || stored.email?.split('@')[0] || 'User',
        email: stored.email,
        phone: stored.phone || '',
        role: stored.role,
      });
    }
  }, []);
  const [addresses, setAddresses] = useState<Address[]>(currentUserAddresses);
  const [storeCredit] = useState(450);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('tanti.products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('tanti.categories', JSON.stringify(categories));
    } catch {}
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('tanti.cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('tanti.wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  const patchOrder = useCallback((id: string, fn: (o: Order) => Order) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? fn(o) : o)));
  }, []);

  const adjustStock = useCallback((productId: string, variantId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== productId
          ? p
          : { ...p, variants: p.variants.map((v) => (v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v)) }
      )
    );
  }, []);

  const addToCart = useCallback((productId: string, variantId: string, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variantId && !i.savedForLater);
      if (existing) return prev.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { key: `${variantId}-${Date.now()}`, productId, variantId, qty }];
    });
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      products,
      orders,
      returns,
      reviews,
      customers,
      cart,
      wishlist,
      compare,
      recentlyViewed,
      user,
      addresses,
      storeCredit,
      miniCartOpen,
      quickViewId,
      compareOpen,
      searchOpen,
      setMiniCartOpen,
      setQuickViewId,
      setCompareOpen,
      setSearchOpen,
      addToCart,
      updateQty: (key, qty) => setCart((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i))),
      changeVariant: (key, variantId) => setCart((prev) => prev.map((i) => (i.key === key ? { ...i, variantId } : i))),
      removeFromCart: (key) => setCart((prev) => prev.filter((i) => i.key !== key)),
      toggleSaveForLater: (key) => setCart((prev) => prev.map((i) => (i.key === key ? { ...i, savedForLater: !i.savedForLater } : i))),
      clearCart: () => setCart((prev) => prev.filter((i) => i.savedForLater)),
      toggleWishlist: (id) => setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      toggleCompare: (id) =>
        setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id])),
      trackView: (id) => setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 8)),
      login: (email) => {
        const stored = authService.getStoredUser();
        if (stored) {
          setUser({
            id: stored.id,
            name: stored.name,
            email: stored.email,
            phone: stored.phone || '',
            role: stored.role,
          });
        }
      },
      register: (u) => {
        const stored = authService.getStoredUser();
        if (stored) {
          setUser({
            id: stored.id,
            name: stored.name,
            email: stored.email,
            phone: stored.phone || '',
            role: stored.role,
          });
        } else {
          setUser({ ...u, id: u.email, role: 'CUSTOMER' });
        }
      },
      logout: () => {
        authService.logout();
        setUser(null);
      },
      saveAddress: (a) =>
        setAddresses((prev) => {
          const exists = prev.some((x) => x.id === a.id);
          let next = exists ? prev.map((x) => (x.id === a.id ? a : x)) : [...prev, a];
          if (a.isDefaultShipping) next = next.map((x) => ({ ...x, isDefaultShipping: x.id === a.id }));
          return next;
        }),
      deleteAddress: (id) => setAddresses((prev) => prev.filter((a) => a.id !== id)),
      setDefaultAddress: (id) => setAddresses((prev) => prev.map((a) => ({ ...a, isDefaultShipping: a.id === id }))),
      placeOrder: (input) => {
        const number = 10499 + orders.filter((o) => Number(o.number.slice(3)) >= 10499).length;
        const lines = cart.filter((i) => !i.savedForLater);
        const items = lines.map((i) => {
          const p = products.find((x) => x.id === i.productId)!;
          const v = p.variants.find((x) => x.id === i.variantId)!;
          return { productId: p.id, variantId: v.id, title: p.title, image: p.images[0], color: v.color, size: v.size, sku: v.sku, price: variantPrice(v), qty: i.qty };
        });
        const isCod = input.paymentMethod === 'cod';
        const order: Order = {
          id: `o${number}`,
          number: `TN-${number}`,
          customerId: user?.id ?? 'guest',
          customerName: input.contact.name,
          email: input.contact.email,
          phone: input.contact.phone,
          createdAt: now(),
          items,
          subtotal: input.subtotal,
          discount: input.discount,
          shipping: input.shippingCost,
          tax: 0,
          total: input.total,
          refunded: 0,
          couponCode: input.couponCode,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'pending',
          status: isCod ? 'confirmed' : 'pending_payment',
          fulfillmentStatus: 'unfulfilled',
          shippingAddress: input.address,
          shippingMethod: input.shippingMethod,
          timeline: isCod
            ? [
                { at: now(), label: 'Order confirmed (Cash on delivery)', by: 'System' },
                { at: now(), label: 'Order placed', by: 'Customer' }
              ]
            : [{ at: now(), label: 'Order placed — awaiting payment', by: 'Customer' }],
          attempts: [],
          notes: [],
          channel: 'online',
          customerNote: input.customerNote
        };
        setOrders((prev) => [order, ...prev]);
        lines.forEach((l) => adjustStock(l.productId, l.variantId, -l.qty));
        setCart((prev) => prev.filter((i) => i.savedForLater));
        return order;
      },
      completePayment: (orderId, result) =>
        patchOrder(orderId, (o) => {
          const attempt = {
            id: `pa${Date.now()}`,
            method: o.paymentMethod,
            amount: o.total,
            status: result === 'success' ? ('paid' as const) : result === 'fail' ? ('failed' as const) : ('cancelled' as const),
            ref: `TRX${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            at: now()
          };
          if (result === 'success') {
            return {
              ...o,
              paymentStatus: 'paid',
              status: 'confirmed',
              attempts: [...o.attempts, attempt],
              timeline: [
                { at: now(), label: 'Order confirmed', by: 'System' },
                { at: now(), label: `Payment verified with gateway (${attempt.ref})`, by: 'System' },
                ...o.timeline
              ]
            };
          }
          return {
            ...o,
            paymentStatus: result === 'fail' ? 'failed' : 'pending',
            attempts: [...o.attempts, attempt],
            timeline: [{ at: now(), label: result === 'fail' ? 'Payment failed' : 'Payment cancelled by customer', by: 'Gateway' }, ...o.timeline]
          };
        }),
      retryPayment: (orderId, method) =>
        patchOrder(orderId, (o) =>
          method === 'cod'
            ? {
                ...o,
                paymentMethod: 'cod',
                status: 'confirmed',
                paymentStatus: 'pending',
                total: o.total + 20,
                shipping: o.shipping + 20,
                timeline: [{ at: now(), label: 'Switched to cash on delivery — order confirmed', by: 'Customer' }, ...o.timeline]
              }
            : { ...o, paymentMethod: method }
        ),
      setOrderStatus: (orderId, status, event) =>
        patchOrder(orderId, (o) => ({
          ...o,
          status,
          courier: event?.courier ?? o.courier,
          tracking: event?.tracking ?? o.tracking,
          fulfillmentStatus: ['shipped', 'out_for_delivery', 'delivered'].includes(status) ? 'fulfilled' : o.fulfillmentStatus,
          paymentStatus: status === 'delivered' && o.paymentMethod === 'cod' && o.codCollected ? 'paid' : o.paymentStatus,
          timeline: [{ at: now(), label: event?.label ?? status, by: event?.by ?? 'Staff', note: event?.note }, ...o.timeline]
        })),
      addOrderNote: (orderId, text, internal, by) =>
        patchOrder(orderId, (o) => ({ ...o, notes: [...o.notes, { text, internal, by, at: now() }] })),
      refundOrder: (orderId, amount, by, reason) =>
        patchOrder(orderId, (o) => {
          const refunded = o.refunded + amount;
          const full = refunded >= o.total;
          return {
            ...o,
            refunded,
            status: full ? 'refunded' : 'partially_refunded',
            paymentStatus: full ? 'refunded' : 'partially_refunded',
            timeline: [{ at: now(), label: `Refund of ৳${amount.toLocaleString('en-IN')} issued`, by, note: reason }, ...o.timeline]
          };
        }),
      markCodCollected: (orderId, by) =>
        patchOrder(orderId, (o) => ({
          ...o,
          codCollected: true,
          paymentStatus: 'paid',
          timeline: [{ at: now(), label: `Cash ৳${o.total.toLocaleString('en-IN')} collected by courier`, by }, ...o.timeline]
        })),
      cancelOrder: (orderId, by) => {
        const o = orders.find((x) => x.id === orderId);
        o?.items.forEach((i) => adjustStock(i.productId, i.variantId, i.qty));
        patchOrder(orderId, (x) => ({
          ...x,
          status: 'cancelled',
          paymentStatus: x.paymentStatus === 'paid' ? 'refunded' : 'cancelled',
          refunded: x.paymentStatus === 'paid' ? x.total : 0,
          timeline: [{ at: now(), label: 'Order cancelled — stock restored', by }, ...x.timeline]
        }));
      },
      createReturn: (r) => {
        const ret: ReturnRequest = {
          ...r,
          id: `R-${3013 + returns.length}`,
          createdAt: now(),
          status: 'requested',
          timeline: [{ at: now(), label: 'Return requested', by: 'Customer' }]
        };
        setReturns((prev) => [ret, ...prev]);
        setOrders((prev) =>
          prev.map((o) =>
            o.number === r.orderNumber
              ? { ...o, status: 'return_requested', timeline: [{ at: now(), label: 'Return requested', by: 'Customer' }, ...o.timeline] }
              : o
          )
        );
        return ret;
      },
      updateReturn: (id, status, by, note) => {
        const ret = returns.find((r) => r.id === id);
        setReturns((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  inspectionNote: note ?? r.inspectionNote,
                  timeline: [{ at: now(), label: returnEventLabel(status, r), by, note }, ...r.timeline]
                }
              : r
          )
        );
        if (ret && (status === 'refunded' || status === 'exchanged')) {
          setOrders((prev) =>
            prev.map((o) => {
              if (o.number !== ret.orderNumber) return o;
              if (status === 'exchanged')
                return { ...o, status: 'delivered', timeline: [{ at: now(), label: 'Exchange completed — replacement delivered', by }, ...o.timeline] };
              const refunded = o.refunded + ret.amount;
              const full = refunded >= o.total - o.shipping;
              return {
                ...o,
                refunded,
                status: full ? 'refunded' : 'partially_refunded',
                paymentStatus: full ? 'refunded' : 'partially_refunded',
                timeline: [{ at: now(), label: `Refund of ৳${ret.amount.toLocaleString('en-IN')} issued for ${ret.id}`, by }, ...o.timeline]
              };
            })
          );
        }
      },
      saveProduct: (p) => setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev])),
      adjustStock,
      updateReview: (id, patch) => setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
      addReview: (r) =>
        setReviews((prev) => [{ ...r, id: `rv${Date.now()}`, date: now().slice(0, 10), status: 'pending', helpful: 0 }, ...prev]),
      categories,
      addCategory: (c) => {
        setCategories((prev) => {
          let updated = [...prev];
          if (c.parentKey && c.parentKey !== 'none') {
            updated = updated.map((p) => {
              if (p.key === c.parentKey && !p.subcategories.includes(c.name)) {
                return { ...p, subcategories: [...p.subcategories, c.name] };
              }
              return p;
            });
          }
          if (updated.some((x) => x.key === c.key)) {
            return updated.map((x) => (x.key === c.key ? c : x));
          }
          return [c, ...updated];
        });
      },
      saveCategory: (key, patch) =>
        setCategories((prev) => {
          const current = prev.find((c) => c.key === key);
          const oldName = current?.name;
          return prev.map((c) => {
            if (c.key === key) {
              return { ...c, ...patch };
            }
            if (oldName && patch.name && oldName !== patch.name && c.subcategories.includes(oldName)) {
              return {
                ...c,
                subcategories: c.subcategories.map((s) => (s === oldName ? patch.name! : s)),
              };
            }
            return c;
          });
        }),
      deleteCategory: (key) => {
        setCategories((prev) => {
          const target = prev.find((c) => c.key === key);
          const targetName = target?.name;
          return prev
            .filter((c) => c.key !== key)
            .map((c) => {
              const updated = { ...c };
              if (c.parentKey === key) {
                updated.parentKey = undefined;
              }
              if (targetName && c.subcategories.includes(targetName)) {
                updated.subcategories = c.subcategories.filter((s) => s !== targetName);
              }
              return updated;
            });
        });
      },
      addSubcategory: (categoryKey, subcategoryName) => {
        const clean = subcategoryName.trim();
        if (!clean) return;
        setCategories((prev) =>
          prev.map((c) => {
            if (c.key !== categoryKey) return c;
            if (c.subcategories.includes(clean)) return c;
            return { ...c, subcategories: [...c.subcategories, clean] };
          })
        );
      },
      removeSubcategory: (categoryKey, subcategoryName) => {
        setCategories((prev) =>
          prev.map((c) => {
            if (c.key !== categoryKey) return c;
            return {
              ...c,
              subcategories: c.subcategories.filter((s) => s !== subcategoryName),
            };
          })
        );
        setProducts((prev) =>
          prev.map((p) => {
            if (p.category === categoryKey && p.subcategory === subcategoryName) {
              return { ...p, subcategory: '' };
            }
            return p;
          })
        );
      },
      renameSubcategory: (categoryKey, oldName, newName) => {
        const clean = newName.trim();
        if (!clean) return;
        setCategories((prev) =>
          prev.map((c) => {
            if (c.key !== categoryKey) return c;
            return {
              ...c,
              subcategories: c.subcategories.map((s) => (s === oldName ? clean : s)),
            };
          })
        );
        setProducts((prev) =>
          prev.map((p) => {
            if (p.category === categoryKey && p.subcategory === oldName) {
              return { ...p, subcategory: clean };
            }
            return p;
          })
        );
      },
      toggleCustomerStatus: (id) =>
        setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c)))
    }),
    [products, categories, orders, returns, reviews, customers, cart, wishlist, compare, recentlyViewed, user, addresses, storeCredit, miniCartOpen, quickViewId, compareOpen, searchOpen, addToCart, patchOrder, adjustStock]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function returnEventLabel(status: ReturnStatus, r: ReturnRequest) {
  switch (status) {
    case 'approved':
      return r.resolution === 'exchange' ? 'Exchange approved — pickup scheduled' : 'Return approved — pickup scheduled';
    case 'rejected':
      return 'Return rejected';
    case 'in_transit':
      return 'Picked up by courier';
    case 'received':
      return 'Item received at warehouse';
    case 'refunded':
      return r.resolution === 'store_credit' ? `Store credit of ৳${r.amount.toLocaleString('en-IN')} issued` : `Refund of ৳${r.amount.toLocaleString('en-IN')} issued`;
    case 'exchanged':
      return 'Replacement shipped';
    default:
      return status;
  }
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
