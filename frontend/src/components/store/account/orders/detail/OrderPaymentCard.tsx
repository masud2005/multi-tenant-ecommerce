'use client';

import React from 'react';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { Badge } from '@/components/ui/Badge';
import { paymentMethodLabel, paymentStatusMeta } from '@/utils/status';
import type { PaymentMethod, PaymentStatus } from '@/types/commerce';

interface OrderPaymentCardProps {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}

export function OrderPaymentCard({
  paymentMethod,
  paymentStatus,
}: OrderPaymentCardProps) {
  const statusMeta = paymentStatusMeta[paymentStatus] || {
    label: paymentStatus,
    tone: 'neutral' as const,
  };

  return (
    <section className="rounded-lg border border-line bg-surface p-5 text-sm">
      <h2 className="font-semibold text-ink">Payment</h2>
      <p className="mt-2 flex items-center gap-2 text-ink">
        <PaymentMark method={paymentMethod} />{' '}
        {paymentMethodLabel[paymentMethod] || paymentMethod}
      </p>
      <div className="mt-2">
        <Badge tone={statusMeta.tone}>
          {statusMeta.label}
        </Badge>
      </div>
    </section>
  );
}
