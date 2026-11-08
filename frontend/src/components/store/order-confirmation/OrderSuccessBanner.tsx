'use client';

import React from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import type { Order } from '@/types/commerce';

interface OrderSuccessBannerProps {
  order: Order;
}

export function OrderSuccessBanner({ order }: OrderSuccessBannerProps) {
  const customerFirstName = order.customerName
    ? order.customerName.split(' ')[0]
    : 'there';

  return (
    <div className="text-center">
      <CheckCircle2Icon className="mx-auto h-12 w-12 text-success" aria-hidden />

      <h1 className="mt-4 font-display text-4xl text-ink">
        Thank you, {customerFirstName}
      </h1>

      <p className="mt-2 text-ink-soft">
        Order <b>{order.number}</b> is confirmed.
        {order.email
          ? ` We’ve emailed your confirmation and invoice to ${order.email}.`
          : ' You can download your invoice below.'}
      </p>
    </div>
  );
}
