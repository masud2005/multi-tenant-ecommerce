'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  CartItem,
  Order,
  OrderStatus,
  PaymentMethod,
  Product,
  ReturnRequest,
  ReturnStatus,
  Review,
  TimelineEvent,
  FulfillmentStatus,
  PaymentStatus,
} from '@/types/commerce';
import { orders as seedOrders, returns as seedReturns } from '@/data/orders';
import { reviews as seedReviews } from '@/data/reviews';
import { variantPrice } from '@/utils/pricing';
import { now, returnEventLabel } from './utils';
import type { PlaceOrderInput, User } from './types';
import { orderService, CreateOrderPayload } from '@/services/order-service';

// Helper to transform backend order response to frontend Order interface
function mapBackendOrderToFrontend(item: any): Order {
  return {
    id: item.id,
    number: item.number,
    customerId: item.customerId || '',
    customerName: item.customerName || '',
    email: item.email || '',
    phone: item.phone || '',
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
    items: (item.items || []).map((i: any) => ({
      productId: i.productId,
      variantId: i.variantId || '',
      title: i.title,
      image: i.image || '',
      color: i.color || '',
      size: i.size || '',
      sku: i.sku || '',
      price: Number(i.price) || 0,
      qty: Number(i.qty) || 1,
    })),
    subtotal: Number(item.subtotal) || 0,
    discount: Number(item.discount) || 0,
    shipping: Number(item.shipping) || 0,
    tax: Number(item.tax) || 0,
    total: Number(item.total) || 0,
    refunded: Number(item.refunded) || 0,
    couponCode: item.couponCode || undefined,
    paymentMethod: (item.paymentMethod?.toLowerCase() || 'cod') as PaymentMethod,
    paymentStatus: (item.paymentStatus?.toLowerCase() || 'pending') as PaymentStatus,
    status: (item.status?.toLowerCase() || 'confirmed') as OrderStatus,
    fulfillmentStatus: (item.fulfillmentStatus?.toLowerCase() || 'unfulfilled') as FulfillmentStatus,
    shippingAddress: item.shippingAddress
      ? {
          id: item.shippingAddress.id || `addr-${item.id}`,
          label: 'Delivery Address',
          name: item.shippingAddress.name,
          phone: item.shippingAddress.phone,
          line1: item.shippingAddress.line1,
          area: item.shippingAddress.area,
          district: item.shippingAddress.district,
        }
      : { id: `addr-${item.id}`, label: 'Delivery Address', name: '', phone: '', line1: '', area: '', district: '' },
    shippingMethod: item.shippingMethod || 'standard',
    courier: item.courier || undefined,
    tracking: item.trackingNumber || undefined,
    timeline: (item.timeline || []).map((t: any) => ({
      at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      label: t.label,
      by: t.by || undefined,
      note: t.note || undefined,
    })),
    attempts: (item.attempts || []).map((a: any) => ({
      id: a.id,
      method: (a.method?.toLowerCase() || 'cod') as PaymentMethod,
      amount: Number(a.amount) || 0,
      status: (a.status?.toLowerCase() || 'pending') as PaymentStatus,
      ref: a.gatewayRef || '',
      at: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
    })),
    notes: [],
    channel: (item.channel?.toLowerCase() === 'manual' ? 'manual' : 'online') as 'online' | 'manual',
    codCollected: !!item.codCollected,
    customerNote: item.customerNote || undefined,
  };
}

export function useStoreOrders(
  user: User | null,
  products: Product[],
  cart: CartItem[],
  adjustStock: (productId: string, variantId: string, delta: number) => void,
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Auto-fetch real orders from backend whenever customer is logged in
  const loadOrdersFromBackend = useCallback(async () => {
    if (!user?.id) {
      setOrders([]);
      return;
    }
    try {
      setIsOrdersLoading(true);
      const res = await orderService.getCustomerOrders();
      if (res?.data && Array.isArray(res.data)) {
        const mapped = res.data.map(mapBackendOrderToFrontend);
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Could not load customer orders from backend:', err);
      setOrders([]);
    } finally {
      setIsOrdersLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadOrdersFromBackend();
    } else {
      setOrders([]);
    }
  }, [user?.id, loadOrdersFromBackend]);

  const patchOrder = useCallback((id: string, fn: (o: Order) => Order) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? fn(o) : o)));
  }, []);

  const placeOrder = useCallback(
    async (input: PlaceOrderInput): Promise<Order> => {
      if (!user?.id) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?next=/checkout';
        }
        throw new Error('Please log in to place an order.');
      }

      const lines = cart.filter((i) => !i.savedForLater);
      const items = lines.map((i) => {
        const p = products.find((x) => x.id === i.productId);
        const v = p?.variants.find((x) => x.id === i.variantId);
        return {
          productId: i.productId,
          variantId: i.variantId,
          title: p?.title || 'Product',
          image: p?.images?.[0] || '',
          color: v?.color || '',
          size: v?.size || '',
          sku: v?.sku || `SKU-${i.productId.slice(0, 6)}`,
          price: v ? variantPrice(v) : 0,
          qty: i.qty,
        };
      });

      const isCod = input.paymentMethod === 'cod';

      // 1. Prepare backend creation payload
      const payload: CreateOrderPayload = {
        shippingAddress: {
          name: input.address.name,
          phone: input.address.phone,
          line1: input.address.line1,
          area: input.address.area,
          district: input.address.district,
        },
        items: items.map((it) => ({
          productId: it.productId,
          variantId: it.variantId,
          title: it.title,
          sku: it.sku,
          price: it.price,
          qty: it.qty,
          image: it.image,
          color: it.color,
          size: it.size,
        })),
        shippingMethod: input.shippingMethod,
        shippingCost: input.shippingCost,
        subtotal: input.subtotal,
        total: input.total,
        discount: input.discount,
        paymentMethod: input.paymentMethod.toUpperCase(),
        paymentStatus: isCod ? 'PENDING' : 'PENDING',
        customerName: input.contact.name || input.address.name,
        phone: input.contact.phone || input.address.phone,
        email: input.contact.email,
        couponCode: input.couponCode,
        customerNote: input.customerNote,
      };

      let finalOrder: Order;

      try {
        const res = await orderService.createOrder(payload);
        if (res?.data) {
          finalOrder = mapBackendOrderToFrontend(res.data);
        } else {
          throw new Error(res?.message || 'Server did not return created order');
        }
      } catch (err) {
        console.warn('Backend order placement failed, falling back to local order:', err);
        const nextSeq = 10500 + orders.length;
        finalOrder = {
          id: `o${nextSeq}`,
          number: `TN-${nextSeq}`,
          customerId: user?.id ?? 'guest',
          customerName: input.contact.name || input.address.name,
          email: input.contact.email,
          phone: input.contact.phone || input.address.phone,
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
                { at: now(), label: 'Order placed', by: 'Customer' },
              ]
            : [{ at: now(), label: 'Order placed — awaiting payment', by: 'Customer' }],
          attempts: [],
          notes: [],
          channel: 'online',
          customerNote: input.customerNote,
        };
      }

      setOrders((prev) => [finalOrder, ...prev.filter((o) => o.id !== finalOrder.id && o.number !== finalOrder.number)]);
      lines.forEach((l) => adjustStock(l.productId, l.variantId, -l.qty));
      setCart((prev) => prev.filter((i) => i.savedForLater));

      return finalOrder;
    },
    [orders, cart, products, user?.id, adjustStock, setCart]
  );

  const completePayment = useCallback(
    (orderId: string, result: 'success' | 'fail' | 'cancel') => {
      patchOrder(orderId, (o) => {
        const attempt = {
          id: `pa${Date.now()}`,
          method: o.paymentMethod,
          amount: o.total,
          status:
            result === 'success'
              ? ('paid' as const)
              : result === 'fail'
              ? ('failed' as const)
              : ('cancelled' as const),
          ref: `TRX${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          at: now(),
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
              ...o.timeline,
            ],
          };
        }
        return {
          ...o,
          paymentStatus: result === 'fail' ? 'failed' : 'pending',
          attempts: [...o.attempts, attempt],
          timeline: [
            {
              at: now(),
              label: result === 'fail' ? 'Payment failed' : 'Payment cancelled by customer',
              by: 'Gateway',
            },
            ...o.timeline,
          ],
        };
      });
    },
    [patchOrder]
  );

  const retryPayment = useCallback(
    (orderId: string, method: PaymentMethod) => {
      patchOrder(orderId, (o) =>
        method === 'cod'
          ? {
              ...o,
              paymentMethod: 'cod',
              status: 'confirmed',
              paymentStatus: 'pending',
              total: o.total + 20,
              shipping: o.shipping + 20,
              timeline: [
                {
                  at: now(),
                  label: 'Switched to cash on delivery — order confirmed',
                  by: 'Customer',
                },
                ...o.timeline,
              ],
            }
          : { ...o, paymentMethod: method }
      );
    },
    [patchOrder]
  );

  const setOrderStatus = useCallback(
    (
      orderId: string,
      status: OrderStatus,
      event?: Partial<TimelineEvent> & { courier?: string; tracking?: string }
    ) => {
      patchOrder(orderId, (o) => ({
        ...o,
        status,
        courier: event?.courier ?? o.courier,
        tracking: event?.tracking ?? o.tracking,
        fulfillmentStatus: ['shipped', 'out_for_delivery', 'delivered'].includes(status)
          ? 'fulfilled'
          : o.fulfillmentStatus,
        paymentStatus:
          status === 'delivered' && o.paymentMethod === 'cod' && o.codCollected
            ? 'paid'
            : o.paymentStatus,
        timeline: [
          {
            at: now(),
            label: event?.label ?? status,
            by: event?.by ?? 'Staff',
            note: event?.note,
          },
          ...o.timeline,
        ],
      }));
    },
    [patchOrder]
  );

  const addOrderNote = useCallback(
    (orderId: string, text: string, internal: boolean, by: string) => {
      patchOrder(orderId, (o) => ({
        ...o,
        notes: [...o.notes, { text, internal, by, at: now() }],
      }));
    },
    [patchOrder]
  );

  const refundOrder = useCallback(
    (orderId: string, amount: number, by: string, reason: string) => {
      patchOrder(orderId, (o) => {
        const refunded = o.refunded + amount;
        const full = refunded >= o.total;
        return {
          ...o,
          refunded,
          status: full ? 'refunded' : 'partially_refunded',
          paymentStatus: full ? 'refunded' : 'partially_refunded',
          timeline: [
            {
              at: now(),
              label: `Refund of ৳${amount.toLocaleString('en-IN')} issued`,
              by,
              note: reason,
            },
            ...o.timeline,
          ],
        };
      });
    },
    [patchOrder]
  );

  const markCodCollected = useCallback(
    (orderId: string, by: string) => {
      patchOrder(orderId, (o) => ({
        ...o,
        codCollected: true,
        paymentStatus: 'paid',
        timeline: [{ at: now(), label: `Cash ৳${o.total.toLocaleString('en-IN')} collected by courier`, by }, ...o.timeline],
      }));
    },
    [patchOrder]
  );

  const cancelOrder = useCallback(
    (orderId: string, by: string) => {
      const o = orders.find((x) => x.id === orderId);
      o?.items.forEach((i) => adjustStock(i.productId, i.variantId, i.qty));
      patchOrder(orderId, (x) => ({
        ...x,
        status: 'cancelled',
        paymentStatus: x.paymentStatus === 'paid' ? 'refunded' : 'cancelled',
        refunded: x.paymentStatus === 'paid' ? x.total : 0,
        timeline: [{ at: now(), label: 'Order cancelled — stock restored', by }, ...x.timeline],
      }));
    },
    [orders, adjustStock, patchOrder]
  );

  const createReturn = useCallback(
    (r: Omit<ReturnRequest, 'id' | 'createdAt' | 'timeline' | 'status'>): ReturnRequest => {
      const ret: ReturnRequest = {
        ...r,
        id: `R-${3013 + returns.length}`,
        createdAt: now(),
        status: 'requested',
        timeline: [{ at: now(), label: 'Return requested', by: 'Customer' }],
      };
      setReturns((prev) => [ret, ...prev]);
      setOrders((prev) =>
        prev.map((o) =>
          o.number === r.orderNumber
            ? {
                ...o,
                status: 'return_requested',
                timeline: [{ at: now(), label: 'Return requested', by: 'Customer' }, ...o.timeline],
              }
            : o
        )
      );
      return ret;
    },
    [returns.length]
  );

  const updateReturn = useCallback(
    (id: string, status: ReturnStatus, by: string, note?: string) => {
      const ret = returns.find((r) => r.id === id);
      setReturns((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                inspectionNote: note ?? r.inspectionNote,
                timeline: [{ at: now(), label: returnEventLabel(status, r), by, note }, ...r.timeline],
              }
            : r
        )
      );
      if (ret && (status === 'refunded' || status === 'exchanged')) {
        setOrders((prev) =>
          prev.map((o) => {
            if (o.number !== ret.orderNumber) return o;
            if (status === 'exchanged') {
              return {
                ...o,
                status: 'delivered',
                timeline: [
                  {
                    at: now(),
                    label: 'Exchange completed — replacement delivered',
                    by,
                  },
                  ...o.timeline,
                ],
              };
            }
            const refunded = o.refunded + ret.amount;
            const full = refunded >= o.total - o.shipping;
            return {
              ...o,
              refunded,
              status: full ? 'refunded' : 'partially_refunded',
              paymentStatus: full ? 'refunded' : 'partially_refunded',
              timeline: [
                {
                  at: now(),
                  label: `Refund of ৳${ret.amount.toLocaleString('en-IN')} issued for ${ret.id}`,
                  by,
                },
                ...o.timeline,
              ],
            };
          })
        );
      }
    },
    [returns]
  );

  const updateReview = useCallback((id: string, patch: Partial<Review>) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const addReview = useCallback(
    (r: Omit<Review, 'id' | 'date' | 'status' | 'helpful'>) => {
      setReviews((prev) => [
        {
          ...r,
          id: `rv${Date.now()}`,
          date: now().slice(0, 10),
          status: 'pending',
          helpful: 0,
        },
        ...prev,
      ]);
    },
    []
  );

  return {
    orders,
    isOrdersLoading,
    loadOrdersFromBackend,
    returns,
    reviews,
    patchOrder,
    placeOrder,
    completePayment,
    retryPayment,
    setOrderStatus,
    addOrderNote,
    refundOrder,
    markCodCollected,
    cancelOrder,
    createReturn,
    updateReturn,
    updateReview,
    addReview,
  };
}
