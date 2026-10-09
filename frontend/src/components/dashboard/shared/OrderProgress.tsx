import React from 'react';
import { Check } from 'lucide-react';
import type { Order } from '@/types/commerce';
import { fulfillmentSteps, stepIndex } from '@/utils/status';
import { cn } from '@/lib/utils';

export function OrderProgress({ order }: { order: Order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="rounded-md bg-neutral-100 dark:bg-neutral-800 p-3 text-xs text-ink-muted">
        This order has been cancelled and fulfillment is stopped.
      </div>
    );
  }

  if (order.status === 'failed') {
    return (
      <div className="rounded-md bg-danger-soft p-3 text-xs text-danger font-medium">
        This order has failed. Check payment attempts and customer contact.
      </div>
    );
  }

  const isPendingPayment = order.status === 'pending_payment';
  const current = isPendingPayment ? -1 : stepIndex(order.status);

  return (
    <div className="space-y-4">
      {isPendingPayment && (
        <div className="flex items-center justify-between rounded-md bg-warning-soft px-3.5 py-2.5 text-xs text-warning border border-warning/20">
          <span>
            <strong>Awaiting Confirmation / Payment:</strong> Customer submitted this order via{' '}
            <span className="uppercase font-semibold">{order.paymentMethod}</span>. Confirm order to start fulfillment.
          </span>
        </div>
      )}
      <ol className="grid grid-cols-6 gap-1" aria-label="Order progress">
        {fulfillmentSteps.map((s, i) => {
          const done = i <= current;
          const isNext = i === current + 1;
          return (
            <li
              key={s.status}
              className="flex flex-col items-center text-center"
              aria-current={i === current ? 'step' : undefined}
            >
              <div className="flex w-full items-center">
                <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : done ? 'bg-ink' : 'bg-line')} />
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    done
                      ? 'border-ink bg-ink text-canvas'
                      : isNext
                      ? 'border-clay bg-surface text-clay font-semibold text-xs'
                      : 'border-line-strong bg-surface text-ink-muted text-xs'
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'h-0.5 flex-1',
                    i === fulfillmentSteps.length - 1 ? 'bg-transparent' : i < current ? 'bg-ink' : 'bg-line'
                  )}
                />
              </div>
              <span
                className={cn(
                  'mt-2 text-xs leading-tight sm:text-xs',
                  done
                    ? 'font-medium text-ink'
                    : isNext
                    ? 'font-medium text-clay'
                    : 'text-ink-muted'
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
