'use client';

import React from 'react';
import { ClockIcon, XCircleIcon } from 'lucide-react';
import { paymentMethods } from '@/data/shipping';
import { Button } from '@/components/ui/button';
import { PaymentMark } from '@/components/ui/PaymentMark';
import { paymentMethodLabel } from '@/utils/status';
import { formatBDT } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Order, PaymentMethod } from '@/types/commerce';

interface OrderPaymentRetryProps {
  order: Order;
  failed: boolean;
  chosenMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  onRetry: () => void;
}

export function OrderPaymentRetry({
  order,
  failed,
  chosenMethod,
  onSelectMethod,
  onRetry,
}: OrderPaymentRetryProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-6 sm:p-8" role="alert">
      {/* Alert Header */}
      <div className="flex items-start gap-4">
        {failed ? (
          <XCircleIcon className="h-8 w-8 shrink-0 text-danger" aria-hidden />
        ) : (
          <ClockIcon className="h-8 w-8 shrink-0 text-warning" aria-hidden />
        )}
        <div>
          <h1 className="font-display text-3xl text-ink">
            {failed ? 'Payment didn’t go through' : 'Awaiting payment'}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Your order <b>{order.number}</b> is saved and the items are reserved for 30 minutes.{' '}
            {failed &&
              'No money was taken — if your account was charged, it will be refunded automatically within 5–7 days.'}
          </p>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div
        className="mt-6 space-y-2"
        role="radiogroup"
        aria-label="Choose a payment method"
      >
        {paymentMethods.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={chosenMethod === p.id}
            onClick={() => onSelectMethod(p.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-md border p-3 text-left cursor-pointer transition-colors',
              chosenMethod === p.id
                ? 'border-ink ring-1 ring-ink'
                : 'border-line-strong hover:border-ink/50'
            )}
          >
            <PaymentMark method={p.id} />
            <span className="text-sm font-medium text-ink">{p.name}</span>
            {p.id === order.paymentMethod && (
              <span className="ml-auto text-xs text-ink-muted">Previous attempt</span>
            )}
          </button>
        ))}
      </div>

      {/* Retry Action Button */}
      <Button size="lg" fullWidth className="mt-5" onClick={onRetry}>
        {chosenMethod === 'cod'
          ? 'Switch to cash on delivery'
          : `Try again with ${paymentMethodLabel[chosenMethod]} · ${formatBDT(order.total)}`}
      </Button>
    </div>
  );
}
