'use client';

import React from 'react';
import type { Address } from '@/types/commerce';

interface OrderDeliveryCardProps {
  shippingAddress: Address;
  shippingMethod: string;
}

export function OrderDeliveryCard({
  shippingAddress,
  shippingMethod,
}: OrderDeliveryCardProps) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5 text-sm">
      <h2 className="font-semibold text-ink">Delivery</h2>
      <p className="mt-2 text-ink">
        {shippingAddress.name} · {shippingAddress.phone}
      </p>
      <p className="text-ink-muted">
        {shippingAddress.line1}, {shippingAddress.area}, {shippingAddress.district}
      </p>
      <p className="mt-2 text-ink-muted">{shippingMethod}</p>
    </section>
  );
}
