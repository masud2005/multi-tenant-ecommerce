'use client';

import { useState, useCallback } from 'react';
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
} from '@/types/commerce';
import { orders as seedOrders, returns as seedReturns } from '@/data/orders';
import { reviews as seedReviews } from '@/data/reviews';
import { variantPrice } from '@/utils/pricing';
import { now, returnEventLabel } from './utils';
import type { PlaceOrderInput, User } from './types';

export function useStoreOrders(
  user: User | null,
  products: Product[],
  cart: CartItem[],
  adjustStock: (productId: string, variantId: string, delta: number) => void,
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
) {
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [returns, setReturns] = useState<ReturnRequest[]>(seedReturns);
  const [reviews, setReviews] = useState<Review[]>(seedReviews);

  const patchOrder = useCallback((id: string, fn: (o: Order) => Order) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? fn(o) : o)));
  }, []);

  const placeOrder = useCallback(
    (input: PlaceOrderInput): Order => {
      const number = 10499 + orders.filter((o) => Number(o.number.slice(3)) >= 10499).length;
      const lines = cart.filter((i) => !i.savedForLater);
      const items = lines.map((i) => {
        const p = products.find((x) => x.id === i.productId)!;
        const v = p.variants.find((x) => x.id === i.variantId)!;
        return {
          productId: p.id,
          variantId: v.id,
          title: p.title,
          image: p.images[0],
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: variantPrice(v),
          qty: i.qty,
        };
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
              { at: now(), label: 'Order placed', by: 'Customer' },
            ]
          : [{ at: now(), label: 'Order placed — awaiting payment', by: 'Customer' }],
        attempts: [],
        notes: [],
        channel: 'online',
        customerNote: input.customerNote,
      };

      setOrders((prev) => [order, ...prev]);
      lines.forEach((l) => adjustStock(l.productId, l.variantId, -l.qty));
      setCart((prev) => prev.filter((i) => i.savedForLater));
      return order;
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
