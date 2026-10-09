'use client';

import React from 'react';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { paymentMethodLabel } from '@/utils/status';
import { formatBDT } from '@/utils/format';
import type { Order } from '@/types/commerce';

interface OrderConfirmationSummaryProps {
  order: Order;
}

export function OrderConfirmationSummary({ order }: OrderConfirmationSummaryProps) {
  const deliveryEstimate = order.shippingMethod?.toLowerCase().includes('pickup')
    ? 'Ready today'
    : order.shippingAddress.district === 'Dhaka'
    ? 'Arrives in 1–2 days'
    : 'Arrives in 3–5 days';

  const paymentText =
    order.paymentStatus === 'paid'
      ? 'Paid'
      : order.paymentMethod === 'cod'
      ? `Pay ${formatBDT(order.total)} on delivery`
      : 'Not paid yet';

  return (
    <div className="mt-10 rounded-lg border border-line bg-surface">
      {/* Three Column Meta: Deliver to, Delivery, and Payment */}
      <div className="grid gap-6 border-b border-line p-6 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-ink-muted">Deliver to</p>
          <p className="mt-1 font-medium text-ink">{order.shippingAddress.name}</p>
          <p className="text-ink-soft">
            {order.shippingAddress.line1}, {order.shippingAddress.area},{' '}
            {order.shippingAddress.district}
          </p>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Delivery</p>
          <p className="mt-1 font-medium text-ink">{order.shippingMethod}</p>
          <p className="text-ink-soft">{deliveryEstimate}</p>
        </div>

        <div>
          <p className="text-xs text-ink-muted">Payment</p>
          <p className="mt-1 flex items-center gap-2 font-medium text-ink">
            <PaymentMark method={order.paymentMethod} />{' '}
            {paymentMethodLabel[order.paymentMethod] || order.paymentMethod}
          </p>
          <p className="text-ink-soft">{paymentText}</p>
        </div>
      </div>

      {/* Item List */}
      <ul className="divide-y divide-line px-6">
        {order.items.map((item) => (
          <li key={item.variantId || item.productId} className="flex items-center gap-4 py-4">
            <img
              src={item.image || '/placeholder.png'}
              alt={item.title}
              className="h-16 w-12 rounded border border-line object-cover"
            />
            <div className="flex-1 text-sm">
              <p className="font-medium text-ink">{item.title}</p>
              <p className="text-xs text-ink-muted">
                {item.color} · {item.size} · Qty {item.qty}
              </p>
            </div>
            <span className="text-sm tabular-nums text-ink">
              {formatBDT(item.price * item.qty)}
            </span>
          </li>
        ))}
      </ul>

      {/* Financial Breakdown */}
      <dl className="space-y-1.5 border-t border-line p-6 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="text-ink">{formatBDT(order.subtotal)}</dd>
        </div>

        {order.discount > 0 && (
          <div className="flex justify-between text-success">
            <dt>Discount</dt>
            <dd>−{formatBDT(order.discount)}</dd>
          </div>
        )}

        <div className="flex justify-between">
          <dt className="text-ink-muted">Delivery & fees</dt>
          <dd className="text-ink">{order.shipping === 0 ? 'Free' : formatBDT(order.shipping)}</dd>
        </div>

        <div className="flex justify-between pt-2 text-base font-semibold text-ink">
          <dt>Total</dt>
          <dd>{formatBDT(order.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
