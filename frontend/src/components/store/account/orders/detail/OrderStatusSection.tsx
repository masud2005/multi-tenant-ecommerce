'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { OrderProgress } from '@/components/store/shared';
import { orderStatusMeta } from '@/utils/status';
import type { Order } from '@/types/commerce';

interface OrderStatusSectionProps {
  order: Order;
  existingReturn?: { id: string };
}

export function OrderStatusSection({ order, existingReturn }: OrderStatusSectionProps) {
  const statusMeta = orderStatusMeta[order.status] || {
    label: order.status,
    tone: 'neutral' as const,
  };

  return (
    <section className="mt-8 rounded-lg border border-line bg-surface p-6">
      {/* Status badge and courier tracking link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tone={statusMeta.tone} dot>
          {statusMeta.label}
        </Badge>

        {order.tracking && (
          <p className="flex items-center gap-2 text-sm">
            {order.courier}: <span className="font-mono">{order.tracking}</span>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="inline-flex items-center gap-1 font-medium underline"
            >
              Track <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden />
            </a>
          </p>
        )}
      </div>

      {/* Visual step-by-step progress bar */}
      <div className="mt-6">
        <OrderProgress order={order} />
      </div>

      {/* Return in progress notice */}
      {existingReturn && (
        <p className="mt-6 rounded-md bg-subtle px-4 py-3 text-sm">
          Return {existingReturn.id} is in progress.{' '}
          <Link href="/account/returns" className="font-medium underline">
            View status
          </Link>
        </p>
      )}
    </section>
  );
}
