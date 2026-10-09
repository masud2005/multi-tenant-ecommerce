'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { orderStatusMeta } from '@/utils/status';
import { formatBDT, formatDate } from '@/utils/format';
import type { Order } from '@/types/commerce';

interface OrderCardProps {
  order: Order;
  onReorder: (orderId: string) => void;
}

export function OrderCard({ order, onReorder }: OrderCardProps) {
  const statusMeta = orderStatusMeta[order.status] || {
    label: order.status,
    tone: 'neutral' as const,
  };

  return (
    <li className="rounded-lg border border-line bg-surface transition-shadow hover:shadow-xs">
      {/* Header bar: Order number, placement date, total price, and status badge */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b border-line px-5 py-3 text-sm">
        <div>
          <p className="text-xs text-ink-muted">Order</p>
          <p className="font-medium text-ink">{order.number}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Placed</p>
          <p className="text-ink">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-ink-muted">Total</p>
          <p className="tabular-nums font-medium text-ink">{formatBDT(order.total)}</p>
        </div>
        <div className="ml-auto">
          <Badge tone={statusMeta.tone} dot>
            {statusMeta.label}
          </Badge>
        </div>
      </div>

      {/* Body: Item preview thumbnails, summary description, and actions */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <div className="flex gap-2 overflow-x-auto">
          {order.items.map((item) => (
            <img
              key={item.variantId || item.productId}
              src={item.image || '/placeholder.png'}
              alt={item.title}
              className="h-20 w-[60px] rounded border border-line object-cover"
            />
          ))}
        </div>

        <p className="min-w-0 flex-1 text-sm text-ink-soft line-clamp-2">
          {order.items.map((item) => item.title).join(', ')}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'delivered' && (
            <Button
              size="sm"
              variant="secondary"
              href={`/account/reviews`}
              className="cursor-pointer gap-1 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>Review Items</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onReorder(order.id)}
          >
            Buy again
          </Button>
          <Button size="sm" href={`/account/orders/${order.number}`}>
            View details
          </Button>
        </div>
      </div>
    </li>
  );
}
