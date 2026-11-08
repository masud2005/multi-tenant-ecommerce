'use client';

import React from 'react';
import Link from 'next/link';
import { ClockIcon, XCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { paymentMethodLabel } from '@/utils/status';
import { formatBDT } from '@/utils/format';
import type { Order } from '@/types/commerce';

interface OrderPaymentRetryProps {
  order: Order;
  failed: boolean;
}

/**
 * Manual bKash/Nagad only — no gateway retry / /pay simulation.
 * Customer waits for store owner verification of the submitted TrxID.
 */
export function OrderPaymentRetry({ order, failed }: OrderPaymentRetryProps) {
  const attempt = order.attempts?.[0];
  const trxId = attempt?.transactionId || '';
  const senderPhone = attempt?.senderPhone || '';

  return (
    <div className="rounded-lg border border-line bg-surface p-6 sm:p-8" role="alert">
      <div className="flex items-start gap-4">
        {failed ? (
          <XCircleIcon className="h-8 w-8 shrink-0 text-danger" aria-hidden />
        ) : (
          <ClockIcon className="h-8 w-8 shrink-0 text-warning" aria-hidden />
        )}
        <div>
          <h1 className="font-display text-3xl text-ink">
            {failed ? 'Payment could not be verified' : 'Payment under review'}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Order <b>{order.number}</b> is saved
            {failed
              ? '. The store could not verify your payment. Please contact support with your TrxID if you already paid.'
              : `. We received your ${paymentMethodLabel[order.paymentMethod] || order.paymentMethod} details and will confirm once the store verifies the transaction.`}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-line bg-canvas p-4 space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <PaymentMark method={order.paymentMethod} />
          <span className="font-medium text-ink">
            {paymentMethodLabel[order.paymentMethod] || order.paymentMethod}
          </span>
          <span className="ml-auto font-semibold tabular-nums text-ink">
            {formatBDT(order.total)}
          </span>
        </div>
        {senderPhone ? (
          <p className="text-xs text-ink-muted">
            Sender:{' '}
            <span className="font-mono text-ink">{senderPhone}</span>
          </p>
        ) : null}
        {trxId ? (
          <p className="text-xs text-ink-muted">
            TrxID:{' '}
            <span className="font-mono font-semibold text-ink">{trxId}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button href={`/account/orders/${order.number}`} className="sm:flex-1">
          View order status
        </Button>
        <Button variant="secondary" href="/contact" className="sm:flex-1">
          Contact support
        </Button>
      </div>

      {!failed && (
        <p className="mt-4 text-xs text-ink-muted">
          No online payment gateway is used. Do not send money again unless the
          store asks you to.
        </p>
      )}
      {failed && (
        <p className="mt-4 text-xs text-ink-muted">
          <Link href="/shop" className="text-clay underline">
            Continue shopping
          </Link>
        </p>
      )}
    </div>
  );
}
