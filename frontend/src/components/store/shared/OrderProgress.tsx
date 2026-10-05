import React from 'react';
import { CheckIcon } from 'lucide-react';
import type { Order } from '@/types/commerce';
import { fulfillmentSteps, stepIndex } from '@/utils/status';
import { cn } from '@/utils/cn';

export function OrderProgress({ order }: { order: Order }) {
  if (['cancelled', 'failed', 'pending_payment'].includes(order.status))
    return null;
  const current = stepIndex(order.status);
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Order progress">
      {fulfillmentSteps.map((s, i) => {
        const done = i <= current;
        return (
          <li
            key={s.status}
            className="flex flex-col items-center text-center"
            aria-current={i === current ? 'step' : undefined}
          >
            <div className="flex w-full items-center">
              <span
                className={cn(
                  'h-0.5 flex-1',
                  i === 0 ? 'bg-transparent' : done ? 'bg-ink' : 'bg-line'
                )}
              />
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  done
                    ? 'border-ink bg-ink text-canvas'
                    : 'border-line-strong bg-surface'
                )}
              >
                {done && (
                  <CheckIcon className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                )}
              </span>
              <span
                className={cn(
                  'h-0.5 flex-1',
                  i === fulfillmentSteps.length - 1
                    ? 'bg-transparent'
                    : i < current
                    ? 'bg-ink'
                    : 'bg-line'
                )}
              />
            </div>
            <span
              className={cn(
                'mt-2 text-xs leading-tight sm:text-xs',
                done ? 'font-medium text-ink' : 'text-ink-muted'
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
