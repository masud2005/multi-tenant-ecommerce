import React from 'react';
import { paymentMethods } from '@/data/shipping';
import type { PaymentMethod } from '@/types/commerce';
import { cn } from '@/lib/utils';

export function PaymentMark({ method, className }: { method: PaymentMethod; className?: string }) {
  const m = paymentMethods.find((p) => p.id === method) ?? { name: method, color: '#1C1A17', short: method.slice(0, 2).toUpperCase() };
  return (
    <span
      className={cn('inline-flex h-6 min-w-[2rem] items-center justify-center rounded px-1.5 text-xs font-bold tracking-tight text-white', className)}
      style={{ backgroundColor: m.color }}
      aria-label={m.name}
    >
      {m.short}
    </span>
  );
}
