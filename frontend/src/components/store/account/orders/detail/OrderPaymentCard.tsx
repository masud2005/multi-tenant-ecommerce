'use client';

import React from 'react';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { Badge } from '@/components/ui/Badge';
import { paymentMethodLabel, paymentStatusMeta } from '@/utils/status';
import type { Order, PaymentMethod, PaymentStatus } from '@/types/commerce';

interface OrderPaymentCardProps {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  order?: Pick<Order, 'attempts' | 'codCollected' | 'status'>;
}

export function OrderPaymentCard({
  paymentMethod,
  paymentStatus,
  order,
}: OrderPaymentCardProps) {
  const statusMeta = paymentStatusMeta[paymentStatus] || {
    label: paymentStatus,
    tone: 'neutral' as const,
  };
  const attempt = order?.attempts?.[0];
  const isManualMfs = paymentMethod === 'bkash' || paymentMethod === 'nagad';
  const awaiting =
    isManualMfs &&
    (paymentStatus === 'pending' || order?.status === 'pending_payment');

  return (
    <section className="rounded-lg border border-line bg-surface p-5 text-sm">
      <h2 className="font-semibold text-ink">Payment</h2>
      <p className="mt-2 flex items-center gap-2 text-ink">
        <PaymentMark method={paymentMethod} />{' '}
        {paymentMethodLabel[paymentMethod] || paymentMethod}
      </p>
      <div className="mt-2">
        <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
      </div>

      {isManualMfs && (attempt?.transactionId || attempt?.senderPhone) ? (
        <div className="mt-3 space-y-1 text-xs text-ink-muted">
          {attempt?.senderPhone ? (
            <p>
              Sender:{' '}
              <span className="font-mono text-ink">{attempt.senderPhone}</span>
            </p>
          ) : null}
          {attempt?.transactionId ? (
            <p>
              TrxID:{' '}
              <span className="font-mono font-medium text-ink">
                {attempt.transactionId}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      {awaiting ? (
        <p className="mt-3 text-xs text-ink-muted">
          Your payment details were submitted. The store will confirm after
          verifying the TrxID.
        </p>
      ) : null}

      {paymentMethod === 'cod' ? (
        <p className="mt-3 text-xs text-ink-muted">
          {order?.codCollected || paymentStatus === 'paid'
            ? 'Cash on delivery has been collected.'
            : 'Pay in cash when your order is delivered.'}
        </p>
      ) : null}
    </section>
  );
}
