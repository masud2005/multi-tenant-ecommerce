'use client';

import React from 'react';
import Link from 'next/link';
import {
  ChevronLeftIcon,
  DownloadIcon,
  RotateCcwIcon,
  XCircleIcon,
  StarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/format';
import type { Order } from '@/types/commerce';

interface OrderDetailHeaderProps {
  order: Order;
  canReturn: boolean;
  canCancel: boolean;
  hasExistingReturn: boolean;
  onDownloadInvoice: () => void;
  onRequestCancel: () => void;
}

export function OrderDetailHeader({
  order,
  canReturn,
  canCancel,
  hasExistingReturn,
  onDownloadInvoice,
  onRequestCancel,
}: OrderDetailHeaderProps) {
  return (
    <div>
      {/* Back to all orders link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden /> All orders
      </Link>

      {/* Header title and action buttons */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Order {order.number}</h1>
          <p className="mt-1 text-sm text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'delivered' && (
            <Button
              size="sm"
              variant="secondary"
              href="/account/reviews"
              className="cursor-pointer gap-1.5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100"
            >
              <StarIcon className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              <span>Review Items</span>
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onDownloadInvoice}
          >
            <DownloadIcon className="h-4 w-4" aria-hidden /> Invoice
          </Button>

          {canReturn && !hasExistingReturn && (
            <Button size="sm" href={`/account/orders/${order.number}/return`}>
              <RotateCcwIcon className="h-4 w-4" aria-hidden /> Return or exchange
            </Button>
          )}

          {canCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRequestCancel}
            >
              <XCircleIcon className="h-4 w-4" aria-hidden /> Cancel order
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
