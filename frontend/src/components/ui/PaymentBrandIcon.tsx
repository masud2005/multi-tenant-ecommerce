import React from 'react';
import { BanknoteIcon } from 'lucide-react';
import { Bkash, Nagad } from 'react-bangla-pay-icons';
import { cn } from '@/utils/cn';
import type { PaymentMethod } from '@/types/commerce';

/** Real bKash / Nagad brand logos (react-bangla-pay-icons) + COD mark */
export function PaymentBrandIcon({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  if (method === 'bkash') {
    return (
      <span
        className={cn('inline-flex h-10 w-[4.5rem] shrink-0 items-center justify-center', className)}
        aria-hidden
      >
        <Bkash width="100%" height="100%" style={{ width: '4.5rem', height: '1.75rem' }} />
      </span>
    );
  }

  if (method === 'nagad') {
    return (
      <span
        className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center', className)}
        aria-hidden
      >
        <Nagad width="100%" height="100%" style={{ width: '2.5rem', height: '2.5rem' }} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-[10px] bg-ink text-canvas',
        className
      )}
      aria-hidden
    >
      <BanknoteIcon className="h-5 w-5" />
    </span>
  );
}
