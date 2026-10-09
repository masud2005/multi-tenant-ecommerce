'use client';

import React from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBDT } from '@/utils/format';
import type { OrderItem } from '@/types/commerce';

interface OrderItemsSectionProps {
  items: OrderItem[];
  orderStatus: string;
}

export function OrderItemsSection({ items, orderStatus }: OrderItemsSectionProps) {
  return (
    <div>
      <h2 className="border-b border-line px-6 py-4 text-sm font-semibold text-ink">Items</h2>
      <ul className="divide-y divide-line px-6">
        {items.map((item) => (
          <li key={item.variantId || item.productId} className="flex items-center gap-4 py-4">
            <img
              src={item.image || '/placeholder.png'}
              alt={item.title}
              className="h-20 w-[60px] rounded border border-line object-cover"
            />
            <div className="flex-1 text-sm">
              <p className="font-medium text-ink">{item.title}</p>
              <p className="text-xs text-ink-muted">
                {item.color} · {item.size} · Qty {item.qty}
              </p>
              {orderStatus === 'delivered' && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    href={`/products/${item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}#reviews`}
                    className="cursor-pointer gap-1.5 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100"
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>Write a Review</span>
                  </Button>
                </div>
              )}
            </div>
            <span className="text-sm tabular-nums text-ink">{formatBDT(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
