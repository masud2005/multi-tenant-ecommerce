'use client';

import React from 'react';
import { CheckCircle2Icon } from 'lucide-react';
import type { Order } from '@/types/commerce';

interface OrderSuccessBannerProps {
  order: Order;
}

export function OrderSuccessBanner({ order }: OrderSuccessBannerProps) {
  const customerFirstName = order.customerName ? order.customerName.split(' ')[0] : 'there';

  return (
    <div className="text-center">
      {/* Green success checkmark */}
      <CheckCircle2Icon className="mx-auto h-12 w-12 text-success" aria-hidden />

      {/* Greeting and order number */}
      <h1 className="mt-4 font-display text-4xl text-ink">
        Thank you, {customerFirstName}
      </h1>

      <p className="mt-2 text-ink-soft">
        Order <b>{order.number}</b> is confirmed.{' '}
        {order.email
          ? `We’ve sent a confirmation to ${order.email} and an SMS to ${order.phone}.`
          : `We’ve sent an SMS confirmation to ${order.phone}.`}
      </p>
    </div>
  );
}
