'use client';

import React from 'react';
import { formatBDT } from '@/utils/format';
import type { Order } from '@/types/commerce';

interface OrderCostBreakdownProps {
  order: Order;
}

export function OrderCostBreakdown({ order }: OrderCostBreakdownProps) {
  return (
    <dl className="space-y-1.5 border-t border-line px-6 py-4 text-sm">
      <div className="flex justify-between">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="text-ink">{formatBDT(order.subtotal)}</dd>
      </div>

      {order.discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
          <dd>−{formatBDT(order.discount)}</dd>
        </div>
      )}

      <div className="flex justify-between">
        <dt className="text-ink-muted">Delivery & fees</dt>
        <dd className="text-ink">{order.shipping ? formatBDT(order.shipping) : 'Free'}</dd>
      </div>

      <div className="flex justify-between pt-1 font-semibold text-ink">
        <dt>Total</dt>
        <dd>{formatBDT(order.total)}</dd>
      </div>

      {order.refunded > 0 && (
        <div className="flex justify-between text-ink-muted">
          <dt>Refunded</dt>
          <dd>−{formatBDT(order.refunded)}</dd>
        </div>
      )}
    </dl>
  );
}
